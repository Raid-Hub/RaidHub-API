import { RaidHubRoute } from "../../RaidHubRoute"
import {
    ClearsLeaderboardsForRaid,
    IndividualBoards,
    UrlPathsToRaid
} from "../../data/leaderboards"
import { cacheControl } from "../../middlewares/cache-control"
import { includedIn } from "../../util/helpers"
import { fail, ok } from "../../util/response"
import { z } from "../../util/zod"
import { getIndividualLeaderboardEntries } from "./_common"
import {
    RaidPathSchema,
    zIndividualLeaderboardEntry,
    zLeaderboardQueryPagination,
    zRaidSchema
} from "./_schema"

export const leaderboardRaidIndividualRoute = new RaidHubRoute({
    method: "get",
    params: RaidPathSchema.extend({
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
            return fail({
                message: "This leaderboard is not available for this raid"
            })
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
        success: z
            .object({
                params: z.object({
                    raid: zRaidSchema,
                    category: z.enum(IndividualBoards),
                    count: z.number(),
                    page: z.number()
                }),
                entries: z.array(zIndividualLeaderboardEntry)
            })
            .strict()
    }
})
