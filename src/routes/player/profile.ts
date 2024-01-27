import { RaidHubRoute } from "../../RaidHubRoute"
import { isContest, isDayOne, isWeekOne } from "../../data/raceDates"
import { ListedRaid } from "../../data/raids"
import { cacheControl } from "../../middlewares/cache-control"
import { registry, zPlayerInfo } from "../../schema/common"
import { z, zBigIntString, zPositiveInt } from "../../schema/zod"
import { prisma } from "../../services/prisma"
import { fail, ok } from "../../util/response"
import { playerRouterParams } from "./_schema"

const zPlayerStatRanking = registry.register(
    "PlayerStatRanking",
    z.object({
        value: z.number().int().nullable(),
        rank: z.number().int().nullable()
    })
)

export const playerProfileRoute = new RaidHubRoute({
    method: "get",
    params: playerRouterParams,
    middlewares: [cacheControl(30)],
    async handler(req) {
        const data = await getPlayer({ membershipId: req.params.membershipId })
        if (!data) {
            return fail(
                { notFound: true, membershipId: req.params.membershipId },
                "Player not found"
            )
        } else {
            return ok(data)
        }
    },
    response: {
        success: z
            .object({
                player: zPlayerInfo,
                stats: z.object({
                    global: z
                        .object({
                            clears: zPlayerStatRanking,
                            fullClears: zPlayerStatRanking,
                            sherpas: zPlayerStatRanking,
                            speed: zPlayerStatRanking
                        })
                        .nullable(),
                    byRaid: z.record(
                        z.object({
                            fastestClear: z
                                .object({
                                    instanceId: z.bigint(),
                                    duration: z.number().int()
                                })
                                .nullable(),
                            clears: z.number().int().nonnegative(),
                            fullClears: z.number().int().nonnegative(),
                            sherpas: z.number().int().nonnegative(),
                            trios: z.number().int().nonnegative(),
                            duos: z.number().int().nonnegative(),
                            solos: z.number().int().nonnegative()
                        })
                    )
                }),
                worldFirstEntries: z.record(
                    z.array(
                        z.object({
                            rank: zPositiveInt(),
                            instanceId: zBigIntString(),
                            raidHash: zBigIntString(),
                            dayOne: z.boolean(),
                            contest: z.boolean(),
                            weekOne: z.boolean()
                        })
                    )
                )
            })
            .strict(),
        error: z.object({
            notFound: z.literal(true),
            membershipId: zBigIntString()
        })
    }
})

type PrismaRawLeaderboardEntry = {
    rank: number
    leaderboard_id: string
    instance_id: bigint
    raid_hash: bigint
    raid_id: ListedRaid
    date_completed: Date
    date_started: Date
}

async function getPlayer({ membershipId }: { membershipId: bigint }) {
    const [player, activityLeaderboardEntries] = await Promise.all([
        prisma.player.findUnique({
            where: {
                membershipId: membershipId
            },
            select: {
                bungieGlobalDisplayName: true,
                bungieGlobalDisplayNameCode: true,
                lastSeen: true,
                displayName: true,
                membershipId: true,
                iconPath: true,
                membershipType: true,
                globalRanks: {
                    select: {
                        clears: true,
                        clearsRank: true,
                        fullClears: true,
                        fullClearsRank: true,
                        sherpas: true,
                        sherpasRank: true,
                        speed: true,
                        speedRank: true
                    }
                },
                stats: {
                    select: {
                        fullClears: true,
                        clears: true,
                        sherpas: true,
                        trios: true,
                        duos: true,
                        solos: true,
                        raidId: true,
                        fastestClear: {
                            select: {
                                instanceId: true,
                                duration: true
                            }
                        }
                    }
                }
            }
        }),
        await prisma.$queryRaw<Array<PrismaRawLeaderboardEntry>>`
            SELECT 
                ale.rank, 
                lb.id AS leaderboard_id,
                a.instance_id,
                a.raid_hash,
                a.date_started,
                a.date_completed,
                rd.raid_id
            FROM 
                activity_leaderboard_entry ale
            JOIN player_activity pa ON pa.instance_id = ale.instance_id 
                AND pa.membership_id = ${membershipId}::bigint 
                AND pa.finished_raid
            JOIN activity a ON pa.instance_id = a.instance_id
            JOIN raid_definition rd ON a.raid_hash = rd.hash
            JOIN leaderboard lb ON ale.leaderboard_id = lb.id;
            `
    ])

    if (!player) {
        return null
    }

    const activityLeaderboardEntriesMap = new Map<string, PrismaRawLeaderboardEntry[]>()
    activityLeaderboardEntries.forEach(entry => {
        if (activityLeaderboardEntriesMap.has(entry.leaderboard_id)) {
            activityLeaderboardEntriesMap.get(entry.leaderboard_id)!.push(entry)
        } else {
            activityLeaderboardEntriesMap.set(entry.leaderboard_id, [entry])
        }
    })

    const { stats, globalRanks, ...restOfPlayer } = player

    return {
        player: restOfPlayer,
        stats: {
            global: {
                clears: {
                    value: globalRanks?.clears ?? null,
                    rank: globalRanks?.clearsRank ?? null
                },
                fullClears: {
                    value: globalRanks?.fullClears ?? null,
                    rank: globalRanks?.fullClearsRank ?? null
                },
                sherpas: {
                    value: globalRanks?.sherpas ?? null,
                    rank: globalRanks?.sherpasRank ?? null
                },
                speed: {
                    value: globalRanks?.speed ?? null,
                    rank: globalRanks?.speedRank ?? null
                }
            },
            byRaid: Object.fromEntries(
                stats.map(({ fastestClear, raidId, ...rest }) => [
                    raidId,
                    {
                        ...rest,
                        fastestClear
                    }
                ])
            )
        },
        worldFirstEntries: Object.fromEntries(
            Array.from(activityLeaderboardEntriesMap.entries()).map(([leaderboardId, entries]) => [
                leaderboardId,
                entries
                    .sort((a, b) => a.rank - b.rank)
                    .map(entry => {
                        return {
                            rank: entry.rank,
                            instanceId: entry.instance_id,
                            raidHash: entry.raid_hash,
                            dayOne: isDayOne(entry.raid_id, entry.date_completed),
                            contest: isContest(entry.raid_id, entry.date_started),
                            weekOne: isWeekOne(entry.raid_id, entry.date_completed)
                        }
                    })
            ])
        )
    }
}
