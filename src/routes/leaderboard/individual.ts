import { includedIn } from "../../util/helpers"
import { z } from "zod"
import { RaidHubRoute, ok } from "../../RaidHubRoute"
import {
    RaidPathSchema,
    zIndividualLeaderboardEntry,
    zLeaderboardQueryPagination,
    zRaidSchema
} from "./_schema"
import {
    ClearsLeaderboardsForRaid,
    IndividualBoards,
    UrlPathsToRaid
} from "../../data/leaderboards"
import { cacheControl } from "../../middlewares/cache-control"
import { getIndividualLeaderboardEntries } from "./_common"

export const leaderboardRaidIndividualRoute = new RaidHubRoute({
    method: "get",
    params: RaidPathSchema.extend({
        category: z.enum(IndividualBoards)
    }).refine(
        schema =>
            includedIn(
                Object.keys(ClearsLeaderboardsForRaid[UrlPathsToRaid[schema.raid]]),
                schema.category
            ),
        "This leaderboard is not available for this raid"
    ),
    query: zLeaderboardQueryPagination,
    middlewares: [cacheControl(30)],
    async handler(req) {
        const { raid, category } = req.params
        const { page, count } = req.query

        const entries = await getIndividualLeaderboardEntries({
            raid,
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
