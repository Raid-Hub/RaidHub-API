import { z } from "zod"
import { RaidHubRoute } from "../../../RaidHubRoute"
import {
    getIndividualGlobalLeaderboard,
    individualGlobalLeaderboardSortColumns,
    searchIndividualGlobalLeaderboard
} from "../../../data-access-layer/leaderboard/individual/global"
import { cacheControl } from "../../../middlewares/cache-control"
import { zLeaderboardData } from "../../../schema/components/LeaderboardData"
import { ErrorCode } from "../../../schema/errors/ErrorCode"
import { zLeaderboardPagination } from "../../../schema/query.ts/LeaderboardPagination"
import { zBigIntString } from "../../../schema/util"

const zCategory = z.enum(["clears", "freshClears", "sherpas", "speedrun"])

const categoryMap: Record<
    z.infer<typeof zCategory>,
    (typeof individualGlobalLeaderboardSortColumns)[number]
> = {
    clears: "clears",
    freshClears: "fresh_clears",
    sherpas: "sherpas",
    speedrun: "speed"
}

export const leaderboardIndividualGlobalRoute = new RaidHubRoute({
    method: "get",
    description: `Individual leaderboards across all raids`,
    params: z.object({
        category: zCategory
    }),
    query: zLeaderboardPagination,
    response: {
        errors: [
            {
                statusCode: 404,
                code: ErrorCode.PlayerNotOnLeaderboardError,
                schema: z.object({
                    membershipId: zBigIntString()
                })
            }
        ],
        success: {
            statusCode: 200,
            schema: zLeaderboardData
        }
    },
    middleware: [cacheControl(15)],
    async handler(req) {
        const { category } = req.params

        const { page, count, search } = req.query

        if (search) {
            const entries = await searchIndividualGlobalLeaderboard({
                membershipId: search,
                take: count,
                column: categoryMap[category]
            })

            if (!entries) {
                return RaidHubRoute.fail(ErrorCode.PlayerNotOnLeaderboardError, {
                    membershipId: search
                })
            }

            return RaidHubRoute.ok({
                type: "individual" as const,
                format: category === "speedrun" ? ("duration" as const) : ("numerical" as const),
                entries
            })
        } else {
            const entries = await getIndividualGlobalLeaderboard({
                skip: (page - 1) * count,
                take: count,
                column: categoryMap[category]
            })

            return RaidHubRoute.ok({
                type: "individual" as const,
                format: category === "speedrun" ? ("duration" as const) : ("numerical" as const),
                entries
            })
        }
    }
})
