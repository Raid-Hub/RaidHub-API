import express, { NextFunction, Request, Response } from "express"
import { failure, includedIn, success } from "../util"
import { ListedRaid, MasterRaid, PrestigeRaid, PrestigeRaids, Raid } from "../data/raids"
import { prisma } from "../database"
import { MasterReleases, PCLeviathanRelease, ReleaseDate } from "../data/raceDates"

export const leaderboardRouter = express.Router()
const raidRouter = express.Router({ mergeParams: true })
const worldfirstRouter = express.Router({ mergeParams: true })

const cacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // cache for 5 minutes
    res.setHeader("Cache-Control", "max-age=300")
    next()
}

leaderboardRouter.use("/:raid", raidRouter)
leaderboardRouter.param("raid", (req, res, next) => {
    if (Object.keys(UrlPathsToRaid).includes(req.params.raid)) {
        next()
    } else {
        res.status(404).json(
            failure({ validPaths: Object.keys(UrlPathsToRaid) }, `Invalid raid: ${req.params.raid}`)
        )
    }
})
raidRouter.use("/worldfirst", worldfirstRouter)

worldfirstRouter.use(cacheMiddleware)

worldfirstRouter.get("/:category", async (req: Request, res) => {
    const category = req.params.category
    const page = req.query.page ? Number(req.query.page) : undefined
    const count = req.query.count ? Number(req.query.count) : undefined

    if (page !== undefined && isNaN(page)) {
        return res.status(400).json(failure({ page: req.query.page }, `Invalid page query param`))
    }
    if (count !== undefined && isNaN(count)) {
        return res.status(400).json(failure({ page: req.query.count }, `Invalid count query param`))
    }
    const raid = UrlPathsToRaid[req.params.raid as keyof typeof UrlPathsToRaid]
    if (includedIn(Object.keys(LeaderboardsForRaid[raid]), category)) {
        try {
            const leaderboard = await getActivityLeaderboard(
                // @ts-ignore
                LeaderboardsForRaid[raid][category],
                category,
                raid,
                {
                    page,
                    count
                }
            )
            return res.status(200).json(success(leaderboard))
        } catch (e) {
            return res.status(500).json(failure(e, "Internal server error"))
        }
    } else {
        res.status(404).json(
            failure({ validBoards: LeaderboardsForRaid[raid] }, `Invalid board: ${category}`)
        )
    }
})

async function getActivityLeaderboard(
    id: string,
    board: string,
    raid: ListedRaid,
    opts: { page?: number; count?: number }
) {
    const count = Math.max(0, Math.floor(Math.min(opts.count ?? 50, 100)))
    const page = Math.max(1, Math.floor(opts.page ?? 1))

    const data = await prisma.activityLeaderboard.findUniqueOrThrow({
        where: {
            id: id
        },
        select: {
            entries: {
                take: count,
                skip: (page - 1) * count,
                orderBy: {
                    rank: "asc"
                },
                select: {
                    rank: true,
                    activity: {
                        select: {
                            activityId: true,
                            raidHash: true,
                            dateStarted: true,
                            dateCompleted: true,
                            playerActivities: {
                                select: {
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
            }
        }
    })

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
        entries: data.entries.map(e => ({
            rank: e.rank,
            activityId: e.activity.activityId,
            dateStarted: e.activity.dateStarted,
            dateCompleted: e.activity.dateCompleted,
            players: e.activity.playerActivities.map(pa => pa.player)
        }))
    }
}

const UrlPathsToRaid = {
    leviathan: Raid.LEVIATHAN,
    eaterofworlds: Raid.EATER_OF_WORLDS,
    spireofstars: Raid.SPIRE_OF_STARS,
    lastwish: Raid.LAST_WISH,
    scourgeofthepast: Raid.SCOURGE_OF_THE_PAST,
    crownofsorrow: Raid.CROWN_OF_SORROW,
    gardenofsalvation: Raid.GARDEN_OF_SALVATION,
    deepstonecrypt: Raid.DEEP_STONE_CRYPT,
    vaultofglass: Raid.VAULT_OF_GLASS,
    vowofthedisciple: Raid.VOW_OF_THE_DISCIPLE,
    kingsfall: Raid.KINGS_FALL,
    rootofnightmares: Raid.ROOT_OF_NIGHTMARES,
    crotasend: Raid.CROTAS_END
} satisfies Record<string, ListedRaid>

type Board = "normal" | "prestige" | "pc" | "challenge" | "master"
export const LeaderboardsForRaid = {
    [Raid.LEVIATHAN]: {
        normal: "0",
        prestige: "0",
        pc: "0"
    },
    [Raid.EATER_OF_WORLDS]: {
        normal: "0",
        prestige: "0"
    },
    [Raid.SPIRE_OF_STARS]: {
        normal: "0",
        prestige: "0"
    },
    [Raid.LAST_WISH]: {
        normal: "0"
    },
    [Raid.SCOURGE_OF_THE_PAST]: {
        normal: "0"
    },
    [Raid.CROWN_OF_SORROW]: {
        normal: "0"
    },
    [Raid.GARDEN_OF_SALVATION]: {
        normal: "0"
    },
    [Raid.DEEP_STONE_CRYPT]: {
        normal: "0"
    },
    [Raid.VAULT_OF_GLASS]: {
        normal: "0",
        challenge: "0",
        master: "0"
    },
    [Raid.VOW_OF_THE_DISCIPLE]: {
        normal: "0",
        master: "wf_vow_master"
    },
    [Raid.KINGS_FALL]: {
        normal: "0",
        challenge: "0",
        master: "0"
    },
    [Raid.ROOT_OF_NIGHTMARES]: {
        normal: "wf_ron",
        master: "0"
    },
    [Raid.CROTAS_END]: {
        normal: "0",
        challenge: "0",
        master: "0"
    }
} satisfies Record<ListedRaid, Partial<Record<Board, string>>>
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
