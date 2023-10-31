import { Router } from "express"
import { ListedRaid, MasterRaid, PrestigeRaid, PrestigeRaids, Raid } from "../../data/raids"
import { failure, includedIn, success } from "../../util"
import { Board, LeaderboardsForRaid, UrlPathsToRaid } from "../leaderboard"
import { prisma } from "../../prisma"
import { MasterReleases, PCLeviathanRelease, ReleaseDate } from "../../data/raceDates"
import { resolve } from "path"

export const worldfirstRouter = Router({ mergeParams: true })

worldfirstRouter.use((_, res, next) => {
    // cache for 5 minutes
    res.setHeader("Cache-Control", "max-age=300")
    next()
})

worldfirstRouter.get("/:category", async (req, res) => {
    const category = req.params.category
    const page = req.query.page ? Number(req.query.page) : undefined
    const count = req.query.count ? Number(req.query.count) : undefined

    if (page !== undefined && isNaN(page)) {
        return res.status(400).json(failure({ page: req.query.page }, `Invalid page query param`))
    }
    if (count !== undefined && isNaN(count)) {
        return res.status(400).json(failure({ page: req.query.count }, `Invalid count query param`))
    }

    // @ts-expect-error
    const raid = UrlPathsToRaid[req.params.raid] as ListedRaid
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
            activityId: e.activity.instanceId,
            dateStarted: e.activity.dateStarted,
            dateCompleted: e.activity.dateCompleted,
            players: e.activity.playerActivity.map(pa => ({
                ...pa.player,
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
