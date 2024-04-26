import { z } from "zod"
import { RaidHubRoute } from "../../../RaidHubRoute"
import { IndividualBoards, IndividualPantheonBoards } from "../../../data/leaderboards"
import { cacheControl } from "../../../middlewares/cache-control"
import { prisma } from "../../../services/prisma"
import { ok } from "../../../util/response"
import { IndividualBoardPositionKeys } from "../_common"
import { zIndividualLeaderboardEntry, zLeaderboardQueryPagination } from "../_schema"

export const pantheonAllRoute = new RaidHubRoute({
    method: "get",
    params: z.object({
        category: z.enum(IndividualPantheonBoards)
    }),
    query: zLeaderboardQueryPagination,
    middlewares: [cacheControl(10)],
    async handler({ query, params }) {
        const { rank, position, value } = IndividualBoardPositionKeys[params.category]

        const entries = await prisma.individualPantheonLeaderboard.findMany({
            where: {
                [position]: {
                    gt: (query.page - 1) * query.count,
                    lte: query.page * query.count
                }
            },
            include: {
                player: {
                    select: {
                        membershipId: true,
                        membershipType: true,
                        iconPath: true,
                        displayName: true,
                        bungieGlobalDisplayName: true,
                        bungieGlobalDisplayNameCode: true,
                        lastSeen: true
                    }
                }
            },
            orderBy: {
                [position]: "asc"
            }
        })

        return ok({
            params: {
                ...params,
                ...query
            },
            entries: entries.map(({ player, ...entry }) => ({
                position: entry[position],
                rank: entry[rank],
                value: entry[value],
                player
            }))
        })
    },
    response: {
        success: {
            statusCode: 200,
            schema: z
                .object({
                    params: zLeaderboardQueryPagination.strict().extend({
                        category: z.enum(IndividualBoards)
                    }),
                    entries: z.array(zIndividualLeaderboardEntry)
                })
                .strict()
        },
        errors: []
    }
})
