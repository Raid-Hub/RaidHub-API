import { Router } from "express"
import { ListedRaid, Raid } from "~/data/raids"
import { success } from "~/util"
import { prisma } from "~/prisma"
import { cacheControl } from "~/middlewares/cache-control"
import { z } from "zod"
import { zodParamsParser, zodQueryParser } from "~/middlewares/parsers"
import { Board, IndividualBoard, IndividualLeaderboardParams } from "~/data/leaderboards"

export const individualRouter = Router({ mergeParams: true })

individualRouter.use(cacheControl(30))

const IndividualLeaderboardQuery = z.object({
    page: z.coerce.number().int().positive().default(1),
    count: z.coerce.number().int().positive().max(100).default(50)
})

individualRouter.get(
    "/:category",
    zodParamsParser(IndividualLeaderboardParams),
    zodQueryParser(IndividualLeaderboardQuery),
    async (req, res, next) => {
        try {
            const { raid, category } = req.params
            const { page, count } = req.query

            const leaderboard = await getClearsLeaderboard(category, raid, {
                page,
                count
            })
            res.status(200).json(success(leaderboard))
        } catch (e) {
            next(e)
        }
    }
)

async function getClearsLeaderboard(
    category: IndividualBoard,
    raid: ListedRaid,
    opts: { page: number; count: number }
) {
    const { page, count } = opts
    // this first query is just used to throw an error if the leaderboard doesn't exist, but also
    // we might use it later for something else

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

    return {
        params: { raid, category, count, page },
        entries: entries.map((e, idx) => ({
            rank: (page - 1) * count + idx + 1,
            value: e[category],
            player: {
                ...e.player,
                membershipId: String(e.player.membershipId)
            }
        }))
    }
}

export const WorldFirstLeaderboardsForRaid: Record<ListedRaid, Board> = {
    [Raid.LEVIATHAN]: "normal",
    [Raid.EATER_OF_WORLDS]: "normal",
    [Raid.SPIRE_OF_STARS]: "normal",
    [Raid.LAST_WISH]: "normal",
    [Raid.SCOURGE_OF_THE_PAST]: "normal",
    [Raid.CROWN_OF_SORROW]: "normal",
    [Raid.GARDEN_OF_SALVATION]: "normal",
    [Raid.DEEP_STONE_CRYPT]: "normal",
    [Raid.VAULT_OF_GLASS]: "challenge",
    [Raid.VOW_OF_THE_DISCIPLE]: "normal",
    [Raid.KINGS_FALL]: "challenge",
    [Raid.ROOT_OF_NIGHTMARES]: "normal",
    [Raid.CROTAS_END]: "challenge"
}
