import { PrismaClient, WorldFirstLeaderboardType } from "@prisma/client"
import { BungieClientProtocol, BungieFetchConfig } from "bungie-net-core"
import {
    getActivityHistory,
    getProfile,
    searchDestinyPlayerByBungieName
} from "bungie-net-core/endpoints/Destiny2"
import { DestinyActivityModeType } from "bungie-net-core/enums"
import {
    BungieNetResponse,
    DestinyPostGameCarnageReportData,
    DestinyPostGameCarnageReportEntry
} from "bungie-net-core/models"
import * as dotenv from "dotenv"
import { gzipSync } from "zlib"
import { ZodError } from "zod"
import { Difficulty, ListedRaids } from "../src/data/raids"
import { zPgcrSchema } from "../src/schema/pgcr"

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
                // @ts-expect-error data is unknown
                throw new Error("Message" in data ? data.Message : "Unknown")
            }
        })
    }
}

main()
    .catch(main)
    .catch(main)
    .then(() => console.log("Seeding complete"))
    .then(() => process.exit(0))

async function main() {
    dotenv.config()
    const names = process.argv.slice(2)
    if (names.length) {
        console.log("Seeding players " + names.join(", "))
        await seedPlayers(names)
    }
    console.log("Seeding database")
    await seed()
}

async function seed() {
    await prisma.activityLeaderboard
        .deleteMany({})
        .then(c => console.log("Deleted", c.count, "entries"))
    await Promise.all(
        ListedRaids.map(async raid => {
            const types: [WorldFirstLeaderboardType, Difficulty[]][] = [
                [WorldFirstLeaderboardType.Normal, [Difficulty.NORMAL]],
                [WorldFirstLeaderboardType.Prestige, [Difficulty.PRESTIGE]],
                [
                    WorldFirstLeaderboardType.Challenge,
                    [Difficulty.CHALLENGE_VOG, Difficulty.CHALLENGE_KF, Difficulty.CHALLENGE_CROTA]
                ],
                [WorldFirstLeaderboardType.Master, [Difficulty.MASTER]]
            ]

            await Promise.all(
                types.map(async ([type, difficulty]) => {
                    const entries = await prisma.activity.findMany({
                        select: {
                            instanceId: true,
                            dateStarted: true,
                            raidDefinition: {
                                select: {
                                    raid: true,
                                    version: true
                                }
                            }
                        },
                        where: {
                            completed: true,
                            raidDefinition: {
                                raidId: raid,
                                versionId: {
                                    in: difficulty
                                }
                            }
                        },
                        orderBy: {
                            dateCompleted: "asc"
                        },
                        take: 100
                    })

                    if (entries.length === 0) {
                        return
                    }

                    // temporary way to determine the date when the race started, not correct for all races (.e. crown)
                    const date = entries[0].dateStarted
                    date.setUTCHours(date.getUTCHours() - 17)
                    date.setUTCHours(17, 0, 0)

                    await prisma.activityLeaderboard
                        .create({
                            data: {
                                id: `${entries[0].raidDefinition.raid.name}-${entries[0].raidDefinition.version.name}`,
                                date: date,
                                raid: {
                                    connect: {
                                        id: raid
                                    }
                                },
                                entries: {
                                    createMany: {
                                        data: entries.map((e, i) => ({
                                            rank: i + 1,
                                            position: i + 1,
                                            instanceId: e.instanceId
                                        })),
                                        skipDuplicates: true
                                    }
                                },
                                type: type
                            },
                            select: {
                                raid: true
                            }
                        })
                        .then(r => console.log(`Seeded ${r.raid.name} ${type}`))
                })
            )
        })
    )

    await prisma.$executeRaw`REFRESH MATERIALIZED VIEW individual_leaderboard WITH DATA`.then(() =>
        console.log("Updated Individual Leaderboards")
    )

    await prisma.$executeRaw`REFRESH MATERIALIZED VIEW global_leaderboard WITH DATA`.then(() =>
        console.log("Updated Global Leaderboards")
    )
}

async function seedPlayers(names: string[]) {
    const COUNT = 250
    const THREADS = 60
    const pgcrQueue = new Set<bigint>()

    const characters = await Promise.all(names.map(findCharacters)).then(c => c.flat())

    const pgcrs = await prisma.playerActivity
        .findMany({
            where: {
                player: {
                    membershipId: {
                        in: characters.map(c => BigInt(c.membershipId))
                    }
                }
            },
            select: {
                instanceId: true
            }
        })
        .then(data => new Set(data.map(r => r.instanceId)))

    await Promise.all(
        characters.map(async char => {
            let page = 0
            let len = 0
            while (len >= (THREADS / 20) * COUNT) {
                const activities = await Promise.all(
                    new Array(THREADS / 20).fill(undefined).map((_, i) =>
                        getActivityHistory(bungieClient, {
                            characterId: char.characterId,
                            destinyMembershipId: char.membershipId,
                            membershipType: char.membershipType,
                            mode: DestinyActivityModeType.Raid,
                            page: page + i,
                            count: COUNT
                        }).then(res => res.Response.activities)
                    )
                ).then(activities => activities.flat())

                console.log(
                    `Found ${activities.length} activities on characterId ${char.characterId}`
                )

                activities.filter(Boolean).forEach(a => {
                    const id = BigInt(a.activityDetails.instanceId)
                    if (!pgcrs.has(id)) {
                        pgcrQueue.add(id)
                    }
                })

                page += THREADS / 20
                len = activities.length
            }
            return
        })
    )

    console.log(`PGCRs already in database: ${pgcrs.size}`)

    let i = 0
    const arr = Array.from(pgcrQueue).sort((a, b) => Number(a) - Number(b))

    console.log(`Adding ${arr.length} activities`)
    while (i < pgcrQueue.size) {
        const ids = arr.splice(0, THREADS)

        const fetchedPGCRs = await Promise.all(
            ids.map(async activityId => {
                console.log(`Loading activity ${activityId}`)
                return fetch(
                    `${
                        process.env.DEV_PROXY_URL || "https://stats.bungie.net"
                    }/Platform/Destiny2/Stats/PostGameCarnageReport/${activityId}/`,
                    {
                        headers: {
                            "x-api-key": process.env.DEV_BUNGIE_API_KEY!
                        }
                    }
                )
                    .then(
                        res =>
                            res.json() as Promise<
                                BungieNetResponse<DestinyPostGameCarnageReportData>
                            >
                    )
                    .then(res => res.Response)
            })
        )

        console.log(`Inserting ${fetchedPGCRs.length} activities & updating players`)
        for (const { players, ...pgcr } of fetchedPGCRs.map(processCarnageReport)) {
            const { raidDefinition } = await prisma.activity
                .create({
                    data: pgcr,
                    select: {
                        raidDefinition: {
                            select: {
                                raidId: true
                            }
                        }
                    }
                })
                .catch(async e => {
                    console.error(e)
                    return {
                        raidDefinition: await prisma.raidDefinition.findUniqueOrThrow({
                            where: {
                                raidHash: pgcr.raidHash
                            },
                            select: {
                                raidId: true
                            }
                        })
                    }
                })

            await Promise.all(
                Array.from(players.values())
                    .slice(0, 50)
                    .map(async p => {
                        const destinyUserInfo = p[0].player.destinyUserInfo
                        const didFinish = p.some(
                            e =>
                                e.values.completed?.basic.value &&
                                e.values.completionReason?.basic.value === 0
                        )
                        const activityDuration =
                            p[0].values.activityDurationSeconds?.basic.value ?? 0
                        const maxActivityDuration =
                            activityDuration === 32767 ? Infinity : activityDuration
                        const { kills, deaths, assists, timePlayedSeconds } = p.reduce(
                            (curr, nxt) => ({
                                kills: curr.kills + (nxt.values.kills?.basic.value ?? 0),
                                deaths: curr.deaths + (nxt.values.deaths?.basic.value ?? 0),
                                assists: curr.assists + (nxt.values.assists?.basic.value ?? 0),
                                timePlayedSeconds: Math.min(
                                    curr.timePlayedSeconds +
                                        (nxt.values.timePlayedSeconds?.basic.value ?? 0),
                                    maxActivityDuration
                                )
                            }),
                            {
                                kills: 0,
                                deaths: 0,
                                assists: 0,
                                timePlayedSeconds: 0
                            }
                        )
                        const data = {
                            lastSeen: pgcr.dateCompleted,
                            playerActivities: {
                                create: {
                                    finishedRaid: didFinish,
                                    kills,
                                    deaths,
                                    assists,
                                    timePlayedSeconds,
                                    instanceId: pgcr.instanceId,
                                    classHash: BigInt(p[0].player.classHash)
                                }
                            },
                            ...(destinyUserInfo.membershipType !== 0
                                ? {
                                      membershipType: destinyUserInfo.membershipType,
                                      iconPath: destinyUserInfo.iconPath,
                                      displayName: destinyUserInfo.displayName,
                                      bungieGlobalDisplayName:
                                          destinyUserInfo.bungieGlobalDisplayName || null,
                                      bungieGlobalDisplayNameCode:
                                          destinyUserInfo.bungieGlobalDisplayNameCode
                                              ? String(
                                                    destinyUserInfo.bungieGlobalDisplayNameCode
                                                ).padStart(4, "0")
                                              : null
                                  }
                                : null)
                        }

                        const statsCreate = {
                            clears: didFinish ? 1 : 0,
                            fresh: didFinish && pgcr.fresh ? 1 : 0,
                            trios: didFinish && pgcr.playerCount === 3 ? 1 : 0,
                            duos: didFinish && pgcr.playerCount === 2 ? 1 : 0,
                            solos: didFinish && pgcr.playerCount === 1 ? 1 : 0,
                            raid: {
                                connect: {
                                    id: raidDefinition.raidId
                                }
                            }
                        }

                        return prisma.player
                            .upsert({
                                create: {
                                    ...data,
                                    clears: didFinish ? 1 : 0,
                                    membershipId: BigInt(destinyUserInfo.membershipId),
                                    stats: {
                                        create: statsCreate
                                    }
                                },
                                update: {
                                    ...data,
                                    clears: didFinish
                                        ? {
                                              increment: 1
                                          }
                                        : undefined,

                                    fullClears:
                                        didFinish && pgcr.fresh
                                            ? {
                                                  increment: 1
                                              }
                                            : undefined,
                                    stats: {
                                        upsert: {
                                            create: statsCreate,
                                            update: {
                                                clears: {
                                                    increment: didFinish ? 1 : 0
                                                },
                                                fullClears: {
                                                    increment: didFinish && pgcr.fresh ? 1 : 0
                                                },
                                                trios: {
                                                    increment:
                                                        didFinish && pgcr.playerCount === 3 ? 1 : 0
                                                },
                                                duos: {
                                                    increment:
                                                        didFinish && pgcr.playerCount === 2 ? 1 : 0
                                                },
                                                solos: {
                                                    increment:
                                                        didFinish && pgcr.playerCount === 1 ? 1 : 0
                                                }
                                            },
                                            where: {
                                                membershipId_raidId: {
                                                    membershipId: BigInt(
                                                        destinyUserInfo.membershipId
                                                    ),
                                                    raidId: raidDefinition.raidId
                                                }
                                            }
                                        }
                                    }
                                },
                                where: {
                                    membershipId: BigInt(destinyUserInfo.membershipId)
                                }
                            })
                            .catch(console.error)
                    })
            )
        }

        console.log(`Inserting ${fetchedPGCRs.length} raw pgcrs`)
        await Promise.all(
            fetchedPGCRs.map(async report => {
                try {
                    const compressed = gzipSync(
                        Buffer.from(JSON.stringify(zPgcrSchema.parse(report)), "utf-8")
                    )
                    await Promise.all([
                        prisma.pGCR.create({
                            data: {
                                instanceId: BigInt(report.activityDetails.instanceId),
                                data: compressed
                            }
                        })
                    ]).catch(console.error)
                } catch (e) {
                    console.error((e as ZodError).errors)
                    throw e
                }
                return report
            })
        )

        i += THREADS
    }
}

async function findCharacters(name: string) {
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

    const characterIds = await getProfile(bungieClient, {
        membershipType: user.membershipType,
        destinyMembershipId: user.membershipId,
        components: [200]
    })
        .then(res => Object.keys(res.Response.characters?.data ?? {}))
        .catch(e => {
            console.error(e)
            process.exit(1)
        })

    console.log(`Found characters ${characterIds.join(", ")}`)

    return characterIds.map(id => ({
        characterId: id,
        membershipId: user.membershipId,
        membershipType: user.membershipType
    }))
}

function processCarnageReport(report: DestinyPostGameCarnageReportData) {
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
    const endDate = new Date(
        startDate.getTime() + report.entries[0]?.values.activityDurationSeconds.basic.value * 1000
    )

    return {
        instanceId: BigInt(report.activityDetails.instanceId),
        raidHash: BigInt(report.activityDetails.directorActivityHash),
        completed: complete,
        flawless:
            complete && report.entries.every(e => e.values.deaths?.basic.value === 0) && fresh,
        fresh: fresh,
        playerCount: players.size,
        dateStarted: startDate,
        dateCompleted: endDate,
        duration: (endDate.getTime() - startDate.getTime()) / 1000,
        platformType: report.activityDetails.membershipType,
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
