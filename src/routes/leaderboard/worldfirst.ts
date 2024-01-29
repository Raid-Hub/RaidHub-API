import { RaidHubRoute } from "../../RaidHubRoute"
import { UrlPathsToRaid, WorldFirstBoards, WorldFirstBoardsMap } from "../../data/leaderboards"
import { cacheControl } from "../../middlewares/cache-control"
import { ErrorCode } from "../../schema/common"
import { z, zISODateString } from "../../schema/zod"
import { fail, ok } from "../../util/response"
import { getWorldFirstLeaderboardEntries } from "./_common"
import { zLeaderboardQueryPagination, zRaidPath, zWorldFirstLeaderboardEntry } from "./_schema"

export const leaderboardRaidWorldfirstRoute = new RaidHubRoute({
    method: "get",
    params: z.object({
        raid: zRaidPath,
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
                ErrorCode.PlayerNotFoundError
            )
        } else {
            return ok({
                params: req.params,
                date: leaderboard.date,
                entries: leaderboard.entries
            })
        }
    },
    response: {
        success: {
            statusCode: 200,
            schema: z
                .object({
                    params: z
                        .object({
                            raid: zRaidPath,
                            category: z.enum(WorldFirstBoards)
                        })
                        .merge(zLeaderboardQueryPagination)
                        .strict(),
                    date: zISODateString(),
                    entries: z.array(zWorldFirstLeaderboardEntry)
                })
                .strict()
        },
        errors: [
            {
                statusCode: 404,
                type: ErrorCode.PlayerNotFoundError,
                schema: z
                    .object({
                        notFound: z.literal(true),
                        params: z
                            .object({
                                raid: zRaidPath,
                                category: z.enum(WorldFirstBoards)
                            })
                            .merge(zLeaderboardQueryPagination)
                            .strict()
                    })
                    .strict()
            }
        ]
    }
})
