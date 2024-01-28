import { RaidHubRoute } from "../../RaidHubRoute"
import {
    ClearsLeaderboardsForRaid,
    IndividualBoards,
    UrlPathsToRaid
} from "../../data/leaderboards"
import { cacheControl } from "../../middlewares/cache-control"
import { z, zPage, zPositiveInt } from "../../schema/zod"
import { includedIn } from "../../util/helpers"
import { fail, ok } from "../../util/response"
import { getIndividualLeaderboardEntries } from "./_common"
import { zIndividualLeaderboardEntry, zLeaderboardQueryPagination, zRaidPath } from "./_schema"

export const leaderboardRaidIndividualRoute = new RaidHubRoute({
    method: "get",
    params: z.object({
        raid: zRaidPath,
        category: z.enum(IndividualBoards)
    }),
    query: zLeaderboardQueryPagination,
    middlewares: [cacheControl(30)],
    async handler(req) {
        const { raid, category } = req.params
        const { page, count } = req.query

        const isAvailable = includedIn(
            Object.keys(ClearsLeaderboardsForRaid[UrlPathsToRaid[raid]]),
            category
        )

        if (!isAvailable) {
            return fail({ unavailable: true }, "This leaderboard is not available for this raid")
        }

        const entries = await getIndividualLeaderboardEntries({
            raid: UrlPathsToRaid[raid],
            category,
            page,
            count
        })

        return ok({
            params: { raid, category, count, page },
            entries
        })
    },
    response: {
        success: {
            statusCode: 200,
            schema: z
                .object({
                    params: z.object({
                        raid: zRaidPath,
                        category: z.enum(IndividualBoards),
                        count: zPositiveInt(),
                        page: zPage()
                    }),
                    entries: z.array(zIndividualLeaderboardEntry)
                })
                .strict()
        },
        error: {
            statusCode: 404,
            schema: z.object({
                type: z.literal("LeaderboardNotFoundError"),
                message: z.string()
            })
        }
    }
})
