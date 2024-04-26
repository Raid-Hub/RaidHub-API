import { z } from "zod"
import { RaidHubRoute } from "../../../RaidHubRoute"
import { cacheControl } from "../../../middlewares/cache-control"
import { prisma } from "../../../services/prisma"
import { ok } from "../../../util/response"
import { zIndividualLeaderboardEntry, zLeaderboardQueryPagination } from "../_schema"

// This is a temporary route that will be removed once the new leaderboard system is in place
export const pantheonFullClearsRoute = new RaidHubRoute({
    method: "get",
    query: zLeaderboardQueryPagination,
    middlewares: [cacheControl(10)],
    async handler({ query }) {
        const entries = await prisma.individualLeaderboard.findMany({
            where: {
                activityId: 101,
                clearsPosition: {
                    gt: (query.page - 1) * query.count,
                    lte: query.page * query.count
                }
            },
            select: {
                fullClearsRank: true,
                fullClearsPosition: true,
                fullClears: true,
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
                clearsPosition: "asc"
            }
        })

        return ok({
            params: query,
            entries: entries.map(({ player, ...entry }) => ({
                position: entry.fullClearsPosition,
                rank: entry.fullClearsRank,
                value: entry.fullClears,
                player
            }))
        })
    },
    response: {
        success: {
            statusCode: 200,
            schema: z
                .object({
                    params: zLeaderboardQueryPagination.strict(),
                    entries: z.array(zIndividualLeaderboardEntry)
                })
                .strict()
        },
        errors: []
    }
})
