import { Router } from "express"
import { success } from "~/util"
import { prisma } from "~/prisma"
import { cacheControl } from "~/middlewares/cache-control"
import { z } from "zod"
import { zodParamsParser, zodQueryParser } from "~/middlewares/parsers"
import { GlobalLeaderboardParams } from "~/data/leaderboards"
import { Player } from "@prisma/client"

export const globalRouter = Router()

globalRouter.use(cacheControl(30))

const IndividualLeaderboardQuery = z.object({
    page: z.coerce.number().int().positive().default(1),
    count: z.coerce.number().int().positive().max(100).default(50)
})

globalRouter.get(
    "/:category",
    zodParamsParser(GlobalLeaderboardParams),
    zodQueryParser(IndividualLeaderboardQuery),
    async (req, res, next) => {
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
                    entries: entries
                })
            )
        } catch (e) {
            next(e)
        }
    }
)

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
