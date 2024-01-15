import { ListedRaid, MasterRaid, PrestigeRaid, Raid } from "~/data/raids"
import { success } from "util/helpers"
import { prisma } from "~/prisma"
import { MasterReleases, PrestigeReleases, ReleaseDate } from "~/data/raceDates"
import { cacheControl } from "~/middlewares/cache-control"
import { z } from "zod"
import { RaidHubRoute } from "route"
import { RaidPathSchema, zLeaderboardQueryPagination } from "./_schema"
import { WorldFirstBoards, WorldFirstBoardsMap } from "~/data/leaderboards"
import { WorldFirstLeaderboardType } from "@prisma/client"

export const leaderboardRaidWorldfirstRoute = new RaidHubRoute({
    path: "/:category",
    method: "get",
    params: RaidPathSchema.extend({
        category: z.enum(WorldFirstBoards).transform(v => WorldFirstBoardsMap[v])
    }),
    query: zLeaderboardQueryPagination,
    middlewares: [cacheControl(30)],
    async handler(req, res, next) {
        try {
            const { raid, category } = req.params
            const { page, count } = req.query

            const leaderboard = await getActivityLeaderboard(category, raid, {
                page,
                count
            })
            res.status(200).json(success(leaderboard))
        } catch (e) {
            next(e)
        }
    }
})

async function getActivityLeaderboard(
    board: WorldFirstLeaderboardType,
    raid: ListedRaid,
    opts: { page: number; count: number }
) {
    const { page, count } = opts
    // throw an error if the leaderboard doesn't exist
    const leaderboard = await prisma.activityLeaderboard.findFirstOrThrow({
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
