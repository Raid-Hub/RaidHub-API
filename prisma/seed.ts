import * as dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import {
    DestinyHistoricalStatsPeriodGroup,
    DestinyPostGameCarnageReportData
} from "bungie-net-core/models"
import { DestinyActivityModeType } from "bungie-net-core/enums"
import {
    getActivityHistory,
    getPostGameCarnageReport,
    getProfile,
    searchDestinyPlayerByBungieName
} from "bungie-net-core/endpoints/Destiny2"
import { BungieClientProtocol, BungieFetchConfig } from "bungie-net-core"

dotenv.config()
const prisma = new PrismaClient()

const bungieClient: BungieClientProtocol = {
    async fetch<T>(config: BungieFetchConfig) {
        const headers = { ...config.headers, ["X-API-KEY"]: process.env.DEV_BUNGIE_API_KEY! }
        return fetch(config.url, {
            ...config,
            headers
        }).then(async res => {
            const data = await res.json()
            if (res.ok) {
                return data as T
            } else {
                // @ts-ignore
                throw new Error(data.Message)
            }
        })
    }
}

async function main() {
    const name = process.argv[2]
    if (!name) {
        console.error("Missing username to seed. Try yarn seed Username#0001")
        process.exit(1)
    }

    const [displayName, displayNameCode] = name.split("#")

    if (!displayName || !displayNameCode) {
        console.error(`Invalid username to seed: ${name}`)
        process.exit(1)
    }

    const user = await searchDestinyPlayerByBungieName(
        bungieClient,
        {
            membershipType: -1
        },
        {
            displayName,
            displayNameCode: Number(displayNameCode)
        }
    )
        .then(res => res.Response[0])
        .catch(e => {
            console.error(e)
            process.exit(1)
        })

    console.log(`Found user ${user.membershipId}`)

    const characters = await getProfile(bungieClient, {
        membershipType: user.membershipType,
        destinyMembershipId: user.membershipId,
        components: [200]
    })
        .then(res => Object.keys(res.Response.characters?.data ?? {}))
        .catch(e => {
            console.error(e)
            process.exit(1)
        })

    console.log(`Found characters ${characters.join(", ")}`)

    const pgcrs = await prisma.activity
        .findMany({
            where: {
                players: {
                    some: {
                        membershipId: user.membershipId
                    }
                }
            }
        })
        .then(data => new Set(data.map(r => r.activityId)))

    console.log(`PGCRs already in database: ${pgcrs.size ? Array.from(pgcrs).join(", ") : "None"}`)

    const COUNT = 250
    const THREADS = 3
    const allActivities = new Map<string, DestinyHistoricalStatsPeriodGroup>()
    const pgcrQueue = new Set<string>()

    await Promise.all(
        characters.map(async characterId => {
            let page = 0
            while (true) {
                const activities = await Promise.all(
                    new Array(THREADS).fill(undefined).map((_, i) =>
                        getActivityHistory(bungieClient, {
                            characterId,
                            destinyMembershipId: user.membershipId,
                            membershipType: user.membershipType,
                            mode: DestinyActivityModeType.Raid,
                            page: page + i,
                            count: COUNT
                        }).then(res => res.Response.activities)
                    )
                ).then(activities => activities.flat())

                console.log(`Found ${activities.length} activities on characterId ${characterId}`)
                if (activities.length < THREADS * COUNT) {
                    break
                }
                activities.forEach(a => {
                    const id = a.activityDetails.instanceId
                    allActivities.set(id, a)
                    if (!pgcrs.has(id)) {
                        pgcrQueue.add(id)
                    }
                })

                page += THREADS
            }
        })
    )

    let i = 0
    const arr = Array.from(pgcrQueue)
    while (i < arr.length) {
        const ids = arr.splice(0, 10)

        const fetchedPGCRs = await Promise.all(
            ids.map(async activityId => {
                // console.log(`Loading activity ${activityId}`)
                return getPostGameCarnageReport(bungieClient, { activityId }).then(res =>
                    processCarnageReport(res.Response)
                )
            })
        )
        i += 10

        await prisma.activity.createMany({
            data: fetchedPGCRs.map(pgcr => ({
                ...pgcr,
                players: undefined
            })),
            skipDuplicates: true
        })
        // .then(({ count }) => console.log(`Inserted ${count} entries`))

        for (const pgcr of fetchedPGCRs) {
            await Promise.all(
                Array.from(pgcr.players.values()).map(p => {
                    const data = {
                        lastSeen: pgcr.dateCompleted,
                        activities: {
                            connect: {
                                activityId: pgcr.activityId
                            }
                        },
                        ...(p.membershipType !== 0
                            ? {
                                  membershipType: p.membershipType,
                                  iconPath: p.iconPath,
                                  displayName: p.displayName,
                                  bungieGlobalDisplayName: p.bungieGlobalDisplayName ?? null,
                                  bungieGlobalDisplayNameCode: p.bungieGlobalDisplayNameCode
                                      ? String(p.bungieGlobalDisplayNameCode)
                                      : null
                              }
                            : null)
                    }
                    return prisma.player.upsert({
                        create: {
                            ...data,
                            membershipId: p.membershipId
                        },
                        update: data,
                        where: {
                            membershipId: p.membershipId
                        }
                    })
                })
            )
        }
    }
}

function processCarnageReport(report: DestinyPostGameCarnageReportData) {
    const players = new Map(
        report.entries.map(e => [e.player.destinyUserInfo.membershipId, e.player.destinyUserInfo])
    )

    return {
        activityId: report.activityDetails.instanceId,
        raidHash: String(report.activityDetails.directorActivityHash),
        completed: false,
        flawless: false,
        fresh: true,
        playerCount: players.size,
        dateStarted: new Date(report.period),
        dateCompleted: new Date(report.period),
        players
    }
}

main()
    .then(() => console.log("Seeding complete"))
    .then(() => process.exit(0))
