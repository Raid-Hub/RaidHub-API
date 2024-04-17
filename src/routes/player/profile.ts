import { WorldFirstLeaderboardType } from "@prisma/client"
import { RaidHubRoute } from "../../RaidHubRoute"
import { isContest, isDayOne, isWeekOne } from "../../data/raceDates"
import { Activity, ListedRaids } from "../../data/raids"
import { cacheControl } from "../../middlewares/cache-control"
import { processPlayerAsync } from "../../middlewares/processPlayerAsync"
import { ErrorCode, registry, zPlayerInfo } from "../../schema/common"
import { z, zBigIntString, zISODateString, zPositiveInt } from "../../schema/zod"
import { prisma } from "../../services/prisma"
import { includedIn } from "../../util/helpers"
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
    middlewares: [cacheControl(30), processPlayerAsync],
    async handler(req) {
        const data = await getPlayer({ membershipId: req.params.membershipId })
        if (!data) {
            return fail(
                { notFound: true, membershipId: req.params.membershipId },
                ErrorCode.PlayerNotFoundError
            )
        } else {
            return ok(data)
        }
    },
    response: {
        success: {
            statusCode: 200,
            schema: z
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
                    worldFirstEntries: z.array(
                        registry.register(
                            "PlayerProfileLeaderboardEntry",
                            z.object({
                                rank: zPositiveInt(),
                                instanceId: zBigIntString(),
                                boardId: z.string(),
                                type: z.nativeEnum(WorldFirstLeaderboardType),
                                activityHash: zBigIntString(),
                                dateCompleted: zISODateString(),
                                dayOne: z.boolean(),
                                contest: z.boolean(),
                                weekOne: z.boolean()
                            })
                        )
                    )
                })
                .strict()
        },
        errors: [
            {
                statusCode: 404,
                type: ErrorCode.PlayerNotFoundError,
                schema: z.object({
                    notFound: z.literal(true),
                    membershipId: zBigIntString()
                })
            }
        ]
    }
})

type PrismaRawLeaderboardEntry = {
    rank: number
    leaderboard_id: string
    leaderboard_type: WorldFirstLeaderboardType
    instance_id: bigint
    hash: bigint
    activity_id: Activity
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
                        activityId: true,
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
                lb.type as leaderboard_type,
                a.instance_id,
                a.hash,
                a.date_started,
                a.date_completed,
                ah.activity_id
            FROM 
                activity_leaderboard_entry ale
            JOIN activity_player pa ON pa.instance_id = ale.instance_id 
                AND pa.membership_id = ${membershipId}::bigint 
                AND pa.completed
            JOIN activity a ON pa.instance_id = a.instance_id
            JOIN activity_hash ah ON ah.hash = a.hash
            JOIN leaderboard lb ON ale.leaderboard_id = lb.id;
            `
    ])

    if (!player) {
        return null
    }

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
                stats.map(({ fastestClear, activityId, ...rest }) => [
                    activityId,
                    {
                        ...rest,
                        fastestClear
                    }
                ])
            )
        },
        worldFirstEntries: activityLeaderboardEntries.map(entry => {
            return {
                boardId: entry.leaderboard_id,
                type: entry.leaderboard_type,
                rank: entry.rank,
                instanceId: entry.instance_id,
                activityHash: entry.hash,
                dateCompleted: entry.date_completed,
                dayOne:
                    includedIn(ListedRaids, entry.activity_id) &&
                    isDayOne(entry.activity_id, entry.date_completed),
                contest:
                    includedIn(ListedRaids, entry.activity_id) &&
                    isContest(entry.activity_id, entry.date_started),
                weekOne:
                    includedIn(ListedRaids, entry.activity_id) &&
                    isWeekOne(entry.activity_id, entry.date_completed)
            }
        })
    }
}
