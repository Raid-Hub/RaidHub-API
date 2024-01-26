import { RaidHubRoute } from "../../RaidHubRoute"
import { UrlPathsToRaid, WorldFirstBoards, WorldFirstBoardsMap } from "../../data/leaderboards"
import { cacheControl } from "../../middlewares/cache-control"
import { fail, ok } from "../../util/response"
import { z } from "../../util/zod"
import { getWorldFirstLeaderboardEntries } from "./_common"
import { RaidPathSchema, zLeaderboardQueryPagination, zWorldFirstLeaderboardEntry } from "./_schema"

export const leaderboardRaidWorldfirstRoute = new RaidHubRoute({
    method: "get",
    params: RaidPathSchema.extend({
        category: z.enum(WorldFirstBoards)
    }),
    query: zLeaderboardQueryPagination,
    middlewares: [cacheControl(30)],
    async handler(req) {
        const leaderboard = await getWorldFirstLeaderboardEntries({
            raidId: UrlPathsToRaid[req.params.raid],
            page: req.query.page,
            count: req.query.count,
            type: WorldFirstBoardsMap[req.params.category]
        })

        if (!leaderboard) {
            return fail(
                { notFound: true, params: { ...req.params, ...req.query } },
                "Leaderboard not found"
            )
        } else {
            return ok({
                params: { ...req.params, ...req.query },
                date: leaderboard.date,
                entries: leaderboard.entries
            })
        }
    },
    response: {
        success: z
            .object({
                params: RaidPathSchema.extend({
                    category: z.enum(WorldFirstBoards)
                })
                    .merge(zLeaderboardQueryPagination)
                    .strict(),
                date: z.date(),
                entries: z.array(zWorldFirstLeaderboardEntry)
            })
            .strict(),
        error: z
            .object({
                notFound: z.boolean(),
                params: RaidPathSchema.extend({
                    category: z.enum(WorldFirstBoards)
                })
                    .merge(zLeaderboardQueryPagination)
                    .strict()
            })
            .strict()
    }
})
