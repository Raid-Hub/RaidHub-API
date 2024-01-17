import { z } from "zod"
import { RaidHubRoute, fail, ok } from "../../RaidHubRoute"
import { RaidPathSchema, zLeaderboardQueryPagination } from "./_schema"
import { WorldFirstLeaderboardType } from "@prisma/client"
import { WorldFirstBoards, WorldFirstBoardsMap } from "../../data/leaderboards"
import { cacheControl } from "../../middlewares/cache-control"
import { zBigIntString } from "../../util/zod-common"
import { ListedRaid } from "../../data/raids"
import { prisma } from "../../prisma"

export const leaderboardRaidWorldfirstRoute = new RaidHubRoute({
    method: "get",
    params: RaidPathSchema.extend({
        category: z.enum(WorldFirstBoards).transform(v => WorldFirstBoardsMap[v])
    }),
    query: zLeaderboardQueryPagination,
    middlewares: [cacheControl(30)],
    async handler(req) {
        const { raid, category } = req.params

        const leaderboard = await getActivityLeaderboard(category, raid, req.query)

        if (!leaderboard) {
            return fail({ notFound: true, category, raid }, 404, "Leaderboard not found")
        } else {
            return ok(leaderboard)
        }
    },
    response: {
        success: z
            .object({
                params: z.object({
                    count: z.number(),
                    page: z.number()
                }),
                date: z.date(),
                entries: z.array(
                    z.object({
                        rank: z.number(),
                        instanceId: zBigIntString(),
                        dateStarted: z.date(),
                        dateCompleted: z.date(),
                        players: z.array(
                            z.object({
                                membershipId: zBigIntString(),
                                membershipType: z.number().nullable(),
                                iconPath: z.string().nullable(),
                                displayName: z.string().nullable(),
                                bungieGlobalDisplayName: z.string().nullable(),
                                bungieGlobalDisplayNameCode: z.string().nullable(),
                                didPlayerFinish: z.boolean()
                            })
                        )
                    })
                )
            })
            .strict(),
        error: z.object({
            notFound: z.boolean(),
            raid: z.number(),
            category: z.string()
        })
    }
})

async function getActivityLeaderboard(
    board: WorldFirstLeaderboardType,
    raid: ListedRaid,
    opts: { page: number; count: number }
) {
    const { page, count } = opts
    // throw an error if the leaderboard doesn't exist
    const leaderboard = await prisma.activityLeaderboard.findFirst({
        select: {
            id: true,
            date: true,
            entries: {
                orderBy: {
                    rank: "asc"
                },
                where: {
                    rank: {
                        gt: (page - 1) * count,
                        lte: page * count
                    }
                },
                select: {
                    rank: true,
                    activity: {
                        select: {
                            instanceId: true,
                            raidHash: true,
                            dateStarted: true,
                            dateCompleted: true,
                            playerActivity: {
                                select: {
                                    finishedRaid: true,
                                    player: {
                                        select: {
                                            membershipId: true,
                                            membershipType: true,
                                            iconPath: true,
                                            displayName: true,
                                            bungieGlobalDisplayName: true,
                                            bungieGlobalDisplayNameCode: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        where: {
            raidId: raid,
            type: board
        }
    })

    if (!leaderboard) return null

    return {
        params: { count, page },
        date: leaderboard.date,
        entries: leaderboard.entries.map(e => ({
            rank: e.rank,
            instanceId: e.activity.instanceId,
            dateStarted: e.activity.dateStarted,
            dateCompleted: e.activity.dateCompleted,
            players: e.activity.playerActivity.map(pa => ({
                ...pa.player,
                didPlayerFinish: pa.finishedRaid
            }))
        }))
    }
}
