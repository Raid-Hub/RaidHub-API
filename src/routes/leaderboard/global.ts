import { success } from "util/helpers"
import { prisma } from "~/prisma"
import { cacheControl } from "~/middlewares/cache-control"
import { z } from "zod"
import { Player } from "@prisma/client"
import { RaidHubRoute } from "route"
import { zLeaderboardQueryPagination } from "./_schema"
import { GlobalBoards, GlobalBoardsMap } from "~/data/leaderboards"

export const leaderboardGlobalRoute = new RaidHubRoute({
    path: "/:category",
    method: "get",
    params: z.object({
        category: z.enum(GlobalBoards).transform(s => GlobalBoardsMap[s])
    }),
    query: zLeaderboardQueryPagination,
    middlewares: [cacheControl(30)],
    async handler(req, res, next) {
        try {
            const { category } = req.params
            const { page, count } = req.query

            const entries = await getGlobalLeaderboard(category, {
                page,
                count
            })
            res.status(200).json(
                success({
                    params: { category, count, page },
                    entries
                })
            )
        } catch (e) {
            next(e)
        }
    }
})

async function getGlobalLeaderboard(category: keyof Player, opts: { page: number; count: number }) {
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
