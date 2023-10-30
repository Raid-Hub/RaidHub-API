import { Router } from "express"
import { failure } from "~/util"
import { ListedRaid, Raid } from "~/data/raids"
import { worldfirstRouter } from "./leaderboard/worldfirst"

export const leaderboardRouter = Router()
const raidRouter = Router({ mergeParams: true })

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

export const UrlPathsToRaid = {
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

export type Board = "normal" | "prestige" | "pc" | "challenge" | "master"
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
        normal: "wf_vow",
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
        challenge: "wf_crota",
        master: "0"
    }
} satisfies Record<ListedRaid, Partial<Record<Board, string>>>
