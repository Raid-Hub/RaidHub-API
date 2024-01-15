import { ListedRaid, Raid } from "~/data/raids"
import { includedIn, success } from "util/helpers"
import { prisma } from "~/prisma"
import { cacheControl } from "~/middlewares/cache-control"
import { z } from "zod"
import { ClearsLeaderboardsForRaid, IndividualBoard, IndividualBoards } from "~/data/leaderboards"
import { RaidHubRoute } from "route"
import { RaidPathSchema, zLeaderboardQueryPagination } from "./_schema"

export const leaderboardRaidIndividualRoute = new RaidHubRoute({
    path: "/:category",
    method: "get",
    params: RaidPathSchema.extend({
        category: z.enum(IndividualBoards)
    }).refine(
        schema => includedIn(Object.keys(ClearsLeaderboardsForRaid[schema.raid]), schema.category),
        "This leaderboard is not available for this raid"
    ),
    query: zLeaderboardQueryPagination,
    middlewares: [cacheControl(30)],
    async handler(req, res, next) {
        try {
            const { raid, category } = req.params
            const { page, count } = req.query

            const entries = await getClearsLeaderboard(category, raid, {
                page,
                count
            })
            res.status(200).json(
                success({
                    params: { raid, category, count, page },
                    entries
                })
            )
        } catch (e) {
            next(e)
        }
    }
})

async function getClearsLeaderboard(
    category: IndividualBoard,
    raid: ListedRaid,
    opts: { page: number; count: number }
) {
    const { page, count } = opts

    const entries = await prisma.playerStats.findMany({
        where: {
            raidId: raid,
            [category]: {
                gt: 0
            }
        },
        skip: (page - 1) * count,
        take: count,
        orderBy: {
            [category]: "desc"
        },
        select: {
            clears: category === "clears",
            fresh: category === "fresh",
            sherpas: category === "sherpas",
            trios: category === "trios",
            duos: category === "duos",
            solos: category === "solos",
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
    })

    return entries.map((e, idx) => ({
        rank: (page - 1) * count + idx + 1,
        value: e[category],
        player: {
            ...e.player,
            membershipId: String(e.player.membershipId)
        }
    }))
}
