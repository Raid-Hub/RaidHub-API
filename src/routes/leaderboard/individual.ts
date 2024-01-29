import { RaidHubRoute } from "../../RaidHubRoute"
import {
    ClearsLeaderboardsForRaid,
    IndividualBoards,
    UrlPathsToRaid
} from "../../data/leaderboards"
import { cacheControl } from "../../middlewares/cache-control"
import { ErrorCode } from "../../schema/common"
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
            Object.entries(ClearsLeaderboardsForRaid[UrlPathsToRaid[raid]])
                .filter(([_, v]) => v)
                .map(([k, _]) => k),
            category
        )

        if (!isAvailable) {
            return fail({ unavailable: true }, ErrorCode.LeaderboardNotFoundError)
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
        errors: [
            {
                statusCode: 404,
                type: ErrorCode.LeaderboardNotFoundError,
                schema: z.object({
                    unavailable: z.literal(true)
                })
            }
        ]
    }
})
