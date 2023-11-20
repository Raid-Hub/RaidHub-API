import { Router } from "express"
import { z } from "zod"
import { zodParamsParser } from "~/middlewares/parsers"
import { ListedRaid, Raid } from "~/data/raids"
import { worldfirstRouter } from "./worldfirst"

export const leaderboardRouter = Router()

export const RaidPathSchema = z.object({
    raid: z
        .enum([
            "leviathan",
            "eaterofworlds",
            "spireofstars",
            "lastwish",
            "scourgeofthepast",
            "crownofsorrow",
            "gardenofsalvation",
            "deepstonecrypt",
            "vaultofglass",
            "vowofthedisciple",
            "kingsfall",
            "rootofnightmares",
            "crotasend"
        ])
        .transform(r => UrlPathsToRaid[r])
})

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

const raidRouter = Router({ mergeParams: true })

leaderboardRouter.use("/:raid", raidRouter)

raidRouter.use("/worldfirst", worldfirstRouter)
