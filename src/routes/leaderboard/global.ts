import { z } from "zod"
import { Player } from "@prisma/client"
import { RaidHubRoute, ok } from "../../RaidHubRoute"
import { zLeaderboardQueryPagination } from "./_schema"
import { prisma } from "../../prisma"
import { zBigIntString } from "../../util/zod-common"
import { GlobalBoards, GlobalBoardsMap } from "../../data/leaderboards"
import { cacheControl } from "../../middlewares/cache-control"

export const leaderboardGlobalRoute = new RaidHubRoute({
    path: "/:category",
    method: "get",
    params: z.object({
        category: z.enum(GlobalBoards).transform(s => GlobalBoardsMap[s])
    }),
    query: zLeaderboardQueryPagination,
    middlewares: [cacheControl(30)],
    async handler(req) {
        const { category } = req.params
        const { page, count } = req.query

        const entries = await getGlobalLeaderboard(category, {
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
                    category: z.string(),
                    count: z.number(),
                    page: z.number()
                }),
                entries: z.array(
                    z.object({
                        rank: z.number(),
                        value: z.number(),
                        player: z.object({
                            membershipId: zBigIntString(),
                            membershipType: z.number().nullable(),
                            iconPath: z.string().nullable(),
                            displayName: z.string().nullable(),
                            bungieGlobalDisplayName: z.string().nullable(),
                            bungieGlobalDisplayNameCode: z.string().nullable()
                        })
                    })
                )
            })
            .strict()
    }
})

async function getGlobalLeaderboard(
    category: keyof Player & ("clears" | "fullClears" | "sherpas"),
    opts: { page: number; count: number }
) {
    const { page, count } = opts

    const entries = await prisma.player.findMany({
        where: {
            [category]: {
                gt: 0
            }
        },
        skip: (page - 1) * count,
        take: count,
        orderBy: {
            [category]: "desc"
        }
    })

    return entries.map((e, idx) => ({
        rank: (page - 1) * count + idx + 1,
        value: e[category],
        player: {
            membershipId: e.membershipId,
            membershipType: e.membershipType,
            iconPath: e.iconPath,
            displayName: e.displayName,
            bungieGlobalDisplayName: e.bungieGlobalDisplayName,
            bungieGlobalDisplayNameCode: e.bungieGlobalDisplayNameCode
        }
    }))
}
