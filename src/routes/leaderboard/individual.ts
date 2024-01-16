import { includedIn } from "../../util/helpers"
import { z } from "zod"
import { RaidHubRoute, ok } from "../../RaidHubRoute"
import { RaidPathSchema, zLeaderboardQueryPagination } from "./_schema"
import {
    ClearsLeaderboardsForRaid,
    IndividualBoard,
    IndividualBoards
} from "../../data/leaderboards"
import { cacheControl } from "../../middlewares/cache-control"
import { zBigIntString } from "../../util/zod-common"
import { ListedRaid } from "../../data/raids"
import { prisma } from "../../prisma"

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
    async handler(req) {
        const { raid, category } = req.params
        const { page, count } = req.query

        const entries = await getClearsLeaderboard(category, raid, {
            page,
            count
        })

        return ok({
            params: { raid, category, count, page },
            entries
        })
    },
    response: {
        success: z
            .object({
                params: z.object({
                    raid: z.number(),
                    category: z.enum(IndividualBoards),
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
        player: e.player
    }))
}
