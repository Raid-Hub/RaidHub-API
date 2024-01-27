import { RaidHubRoute } from "../../RaidHubRoute"
import { UrlPathsToRaid } from "../../data/leaderboards"
import { cacheControl } from "../../middlewares/cache-control"
import { zPlayerInfo } from "../../schema/common"
import { z, zDigitString, zISODateString, zPage, zPositiveInt } from "../../schema/zod"
import { prisma } from "../../services/prisma"
import { ok } from "../../util/response"
import { RaidPath, zLeaderboardQueryPagination, zRaidPath } from "./_schema"

export const leaderboardSpeedrunRoute = new RaidHubRoute({
    method: "get",
    params: z.object({
        raid: zRaidPath
    }),
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
                    count: zPositiveInt(),
                    page: zPage(),
                    raid: zRaidPath
                }),
                entries: z.array(
                    z.object({
                        rank: z.number(),
                        instanceId: zDigitString(),
                        dateStarted: zISODateString(),
                        dateCompleted: zISODateString(),
                        duration: zPositiveInt(),
                        players: z.array(zPlayerInfo)
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
            duration: true,
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
        duration: e.duration,
        players: e.playerActivity.map(pa => ({
            ...pa.player,
            didPlayerFinish: pa.finishedRaid
        }))
    }))
}
