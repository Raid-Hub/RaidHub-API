import { Router } from "express"
import { ListedRaid, MasterRaid, PrestigeRaid, PrestigeRaids, Raid } from "~/data/raids"
import { includedIn, success } from "~/util"
import { prisma } from "~/prisma"
import { MasterReleases, PCLeviathanRelease, ReleaseDate } from "~/data/raceDates"
import { cacheControl } from "~/middlewares/cache-control"
import { z } from "zod"
import { zodParamsParser, zodQueryParser } from "~/middlewares/parsers"
import { RaidPathSchema, UrlPathsToRaid } from "./leaderboard"

const Boards = ["normal", "prestige", "pc", "challenge", "master"] as const
type Board = (typeof Boards)[number]

const LeaderboardsForRaid = {
    [Raid.LEVIATHAN]: {
        normal: "wf_levi",
        prestige: "levi_prestige",
        pc: "levi_pc"
    },
    [Raid.EATER_OF_WORLDS]: {
        normal: "wf_eow",
        prestige: "eow_prestige"
    },
    [Raid.SPIRE_OF_STARS]: {
        normal: "wf_spire",
        prestige: "spire_prestige"
    },
    [Raid.LAST_WISH]: {
        normal: "wf_wish"
    },
    [Raid.SCOURGE_OF_THE_PAST]: {
        normal: "wf_sotp"
    },
    [Raid.CROWN_OF_SORROW]: {
        normal: "wf_cos"
    },
    [Raid.GARDEN_OF_SALVATION]: {
        normal: "wf_gos"
    },
    [Raid.DEEP_STONE_CRYPT]: {
        normal: "wf_dsc"
    },
    [Raid.VAULT_OF_GLASS]: {
        normal: "vog_normal",
        challenge: "wf_vog",
        master: "vog_master"
    },
    [Raid.VOW_OF_THE_DISCIPLE]: {
        normal: "wf_vow",
        master: "vow_master"
    },
    [Raid.KINGS_FALL]: {
        normal: "kf_normal",
        challenge: "wf_kf",
        master: "kf_master"
    },
    [Raid.ROOT_OF_NIGHTMARES]: {
        normal: "wf_ron",
        master: "ron_master"
    },
    [Raid.CROTAS_END]: {
        normal: "crota_normal",
        challenge: "wf_crota",
        master: "crota_master"
    }
} satisfies Record<ListedRaid, Partial<Record<Board, string>>>

export const worldfirstRouter = Router({ mergeParams: true })

worldfirstRouter.use(cacheControl(300))

const WorldFirstLeaderboardParams = RaidPathSchema.extend({
    category: z.enum(Boards)
}).refine(
    schema => includedIn(Object.keys(LeaderboardsForRaid[schema.raid]), schema.category),
    "This leaderboard is not available for this raid"
)

const WorldFirstLeaderboardQuery = z.object({
    page: z.coerce.number().int().positive().default(1),
    count: z.coerce.number().int().positive().max(100).default(50)
})

worldfirstRouter.get(
    "/:category",
    zodParamsParser(WorldFirstLeaderboardParams),
    zodQueryParser(WorldFirstLeaderboardQuery),
    async (req, res, next) => {
        try {
            const { raid, category } = req.params
            const { page, count } = req.query

            // @ts-expect-error the generics required to make this work are simply not worth, the params parser handles
            // the run-time validation for us
            const boardId = LeaderboardsForRaid[raid][category] as string

            const leaderboard = await getActivityLeaderboard(boardId, category, raid, {
                page,
                count
            })
            res.status(200).json(success(leaderboard))
        } catch (e) {
            next(e)
        }
    }
)

async function getActivityLeaderboard(
    id: string,
    board: string,
    raid: ListedRaid,
    opts: { page: number; count: number }
) {
    const { page, count } = opts
    // this first query is just used to throw an error if the leaderboard doesn't exist, but also
    // we might use it later for something else
    const [leaderboard, entries] = await Promise.all([
        prisma.activityLeaderboard.findUniqueOrThrow({
            where: {
                id: id
            }
        }),
        prisma.activityLeaderboardEntry.findMany({
            where: {
                leaderboardId: id,
                rank: {
                    gt: (page - 1) * count,
                    lte: page * count
                }
            },
            orderBy: {
                rank: "asc"
            },
            select: {
                rank: true,
                activity: {
                    select: {
                        instanceId: true,
                        raidHash: true,
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
                }
            }
        })
    ])

    let date = undefined
    switch (board) {
        case "normal":
            date = ReleaseDate[raid]
            break
        case "prestige":
            date = PrestigeRaids[raid as PrestigeRaid]
            break
        case "pc":
            date = PCLeviathanRelease
            break
        case "challenge":
            date = ReleaseDate[raid]
            break
        case "master":
            date = MasterReleases[raid as MasterRaid]
            break
    }

    return {
        params: { count, page },
        date,
        entries: entries.map(e => ({
            rank: e.rank,
            instanceId: String(e.activity.instanceId),
            dateStarted: e.activity.dateStarted,
            dateCompleted: e.activity.dateCompleted,
            players: e.activity.playerActivity.map(pa => ({
                ...pa.player,
                membershipId: String(pa.player.membershipId),
                didPlayerFinish: pa.finishedRaid
            }))
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
