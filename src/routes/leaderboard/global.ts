import { RaidHubRoute } from "../../RaidHubRoute"
import { GlobalBoards } from "../../data/leaderboards"
import { cacheControl } from "../../middlewares/cache-control"
import { z, zPage, zPositiveInt } from "../../schema/zod"
import { ok } from "../../util/response"
import { getGlobalLeaderboardEntries } from "./_common"
import { zIndividualLeaderboardEntry, zLeaderboardQueryPagination } from "./_schema"

export const leaderboardGlobalRoute = new RaidHubRoute({
    method: "get",
    params: z.object({
        category: z.enum(GlobalBoards)
    }),
    query: zLeaderboardQueryPagination,
    middlewares: [cacheControl(30)],
    async handler(req) {
        const { category } = req.params
        const { page, count } = req.query

        const entries = await getGlobalLeaderboardEntries({
            category,
            page,
            count
        })

        return ok({
            params: { category, count, page },
            entries
        })
    },
    response: {
        success: z
            .object({
                params: z.object({
                    category: z.enum(GlobalBoards),
                    count: zPositiveInt(),
                    page: zPage()
                }),
                entries: z.array(zIndividualLeaderboardEntry)
            })
            .strict()
    }
})
