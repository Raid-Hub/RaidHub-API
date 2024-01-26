import { RaidHubRoute } from "../../RaidHubRoute"
import { UrlPathsToRaid } from "../../data/leaderboards"
import { cacheControl } from "../../middlewares/cache-control"
import { prisma } from "../../services/prisma"
import { ok } from "../../util/response"
import { z, zDigitString } from "../../util/zod"
import { RaidPath, RaidPathSchema, zLeaderboardQueryPagination } from "./_schema"

export const leaderboardSpeedrunRoute = new RaidHubRoute({
    method: "get",
    params: RaidPathSchema,
    query: zLeaderboardQueryPagination,
    middlewares: [cacheControl(30)],
    async handler(req) {
        const entries = await getSpeedrunLeaderboard(req.params.raid, req.query)

        return ok({
            params: { ...req.query, raid: req.params.raid },
            entries
        })
    },
    response: {
        success: z
            .object({
                params: z.object({
                    count: z.number(),
                    page: z.number(),
                    raid: z.string()
                }),
                entries: z.array(
                    z.object({
                        rank: z.number(),
                        instanceId: zDigitString(),
                        dateStarted: z.date(),
                        dateCompleted: z.date(),
                        players: z.array(
                            z.object({
                                membershipId: zDigitString(),
                                membershipType: z.number().nullable(),
                                iconPath: z.string().nullable(),
                                displayName: z.string().nullable(),
                                bungieGlobalDisplayName: z.string().nullable(),
                                bungieGlobalDisplayNameCode: z.string().nullable(),
                                didPlayerFinish: z.boolean()
                            })
                        )
                    })
                )
            })
            .strict()
    }
})

async function getSpeedrunLeaderboard(raid: RaidPath, opts: { page: number; count: number }) {
    const { page, count } = opts

    const entries = await prisma.activity.findMany({
        where: {
            raidDefinition: {
                raidId: UrlPathsToRaid[raid]
            },
            completed: true,
            fresh: true
        },
        orderBy: {
            duration: "asc"
        },
        skip: (page - 1) * count,
        take: count,
        select: {
            instanceId: true,
            dateStarted: true,
            dateCompleted: true,
            playerActivity: {
                select: {
                    finishedRaid: true,
                    player: {
                        select: {
                            membershipId: true,
                            membershipType: true,
                            iconPath: true,
                            displayName: true,
                            bungieGlobalDisplayName: true,
                            bungieGlobalDisplayNameCode: true
                        }
                    }
                }
            }
        }
    })

    return entries.map((e, idx) => ({
        rank: (page - 1) * count + idx + 1,
        instanceId: e.instanceId,
        dateStarted: e.dateStarted,
        dateCompleted: e.dateCompleted,
        players: e.playerActivity.map(pa => ({
            ...pa.player,
            didPlayerFinish: pa.finishedRaid
        }))
    }))
}
