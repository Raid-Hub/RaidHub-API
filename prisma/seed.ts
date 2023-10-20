import * as dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import {
    DestinyHistoricalStatsPeriodGroup,
    DestinyPostGameCarnageReportData,
    DestinyPostGameCarnageReportEntry
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

// interface with bungie api
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
        console.error("Missing username to seed. Try yarn db:seed Username#0001")
        process.exit(1)
    }

    const [displayName, displayNameCode] = name.split("#")

    if (!displayName || !displayNameCode) {
        console.error(`Invalid username to seed: ${name}`)
        process.exit(1)
    }

    // Find the we are going to seed
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

    const pgcrs = await prisma.playerActivities
        .findMany({
            where: {
                player: {
                    membershipId: user.membershipId
                }
            },
            select: {
                activityId: true
            }
        })
        .then(data => new Set(data.map(r => r.activityId)))

    console.log(`PGCRs already in database: ${pgcrs.size}`)

    const COUNT = 250
    const THREADS = 3
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

                activities.filter(Boolean).forEach(a => {
                    const id = a.activityDetails.instanceId
                    if (!pgcrs.has(id)) {
                        pgcrQueue.add(id)
                    }
                })

                page += THREADS

                if (activities.length < THREADS * COUNT) {
                    break
                }
            }
            return
        })
    )

    let i = 0
    const PGCR_THREADS = 10
    const arr = Array.from(pgcrQueue).sort((a, b) => Number(a) - Number(b))
    console.log(`Adding ${arr.length} activities`)
    while (i < pgcrQueue.size) {
        const ids = arr.splice(0, PGCR_THREADS)

        const fetchedPGCRs = await Promise.all(
            ids.map(async activityId => {
                console.log(`Loading activity ${activityId}`)
                return getPostGameCarnageReport(bungieClient, { activityId }).then(res =>
                    processCarnageReport(res.Response)
                )
            })
        )

        await prisma.activity
            .createMany({
                data: fetchedPGCRs.map(pgcr => ({
                    ...pgcr,
                    players: undefined
                })),
                skipDuplicates: true
            })
            .then(({ count }) => console.log(`Inserted ${count} entries`))

        for (const pgcr of fetchedPGCRs) {
            await Promise.all(
                Array.from(pgcr.players.values()).map(async p => {
                    const destinyUserInfo = p[0].player.destinyUserInfo
                    const didFinish = p.some(
                        e =>
                            e.values.completed?.basic.value &&
                            e.values.completionReason?.basic.value === 0
                    )
                    const data = {
                        lastSeen: pgcr.dateCompleted,
                        playerActivities: {
                            create: {
                                finishedRaid: didFinish,
                                activityId: pgcr.activityId
                            }
                        },
                        ...(destinyUserInfo.membershipType !== 0
                            ? {
                                  membershipType: destinyUserInfo.membershipType,
                                  iconPath: destinyUserInfo.iconPath,
                                  displayName: destinyUserInfo.displayName,
                                  bungieGlobalDisplayName:
                                      destinyUserInfo.bungieGlobalDisplayName ?? null,
                                  bungieGlobalDisplayNameCode:
                                      destinyUserInfo.bungieGlobalDisplayNameCode
                                          ? fixBungieCode(
                                                destinyUserInfo.bungieGlobalDisplayNameCode
                                            )
                                          : null
                              }
                            : null)
                    }
                    return prisma.player
                        .upsert({
                            create: {
                                ...data,
                                clears: didFinish ? 1 : 0,
                                membershipId: destinyUserInfo.membershipId
                            },
                            update: {
                                ...data,
                                clears: didFinish
                                    ? {
                                          increment: 1
                                      }
                                    : undefined
                            },
                            where: {
                                membershipId: destinyUserInfo.membershipId
                            }
                        })
                        .then(d =>
                            console.log(
                                `Updated or created user ${
                                    d.bungieGlobalDisplayName ?? d.displayName ?? d.membershipId
                                }`
                            )
                        )
                })
            )
        }

        i += PGCR_THREADS
    }
}

async function processCarnageReport(report: DestinyPostGameCarnageReportData) {
    await prisma.rawPGCR
        .create({
            data: {
                id: report.activityDetails.instanceId,
                rawJson: JSON.stringify(report)
            }
        })
        .catch(console.error)

    const players = new Map<string, DestinyPostGameCarnageReportEntry[]>()

    report.entries.forEach(e => {
        if (players.has(e.player.destinyUserInfo.membershipId)) {
            players.get(e.player.destinyUserInfo.membershipId)!.push(e)
        } else {
            players.set(e.player.destinyUserInfo.membershipId, [e])
        }
    })

    const complete = report.entries.some(
        e => e.values.completed?.basic.value && e.values.completionReason?.basic.value === 0
    )
    const fresh = isFresh(report)
    const startDate = new Date(report.period)

    return {
        activityId: report.activityDetails.instanceId,
        raidHash: String(report.activityDetails.directorActivityHash),
        completed: complete,
        flawless:
            complete && report.entries.every(e => e.values.deaths?.basic.value === 0) && fresh,
        fresh: fresh,
        playerCount: players.size,
        dateStarted: startDate,
        dateCompleted: new Date(
            startDate.getTime() +
                report.entries[0]?.values.activityDurationSeconds.basic.value * 1000
        ),
        players
    }
}

const beyondLightStart = new Date("November 10, 2020 9:00:00 AM PST").getTime()
const witchQueenStart = new Date("February 22, 2022 9:00:00 AM PST").getTime()
const hauntedStart = new Date("May 24, 2022 10:00:00 AM PDT").getTime()
/**
 * Pre beyond light, startingPhaseIndex is accurate. During beyond light, we don't know anything.
 * During risen, some fresh runs are marked as checkpoints due to wipes.
 * After that, activityWasStartedFromBeginning is accurate
 */
function isFresh(pgcr: DestinyPostGameCarnageReportData): boolean | null {
    const start = new Date(pgcr.period).getTime()

    if (start < witchQueenStart) {
        return start < beyondLightStart ? pgcr.startingPhaseIndex === 0 : null
    } else {
        return pgcr.activityWasStartedFromBeginning || (start < hauntedStart ? null : false)
    }
}

function fixBungieCode(code: number) {
    const str = String(code)
    const missingZeroes = 4 - str.length
    return `${"0".repeat(missingZeroes)}${str}`
}

main()
    .then(() => console.log("Seeding complete"))
    .then(() => process.exit(0))