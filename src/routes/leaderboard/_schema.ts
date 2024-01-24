import { z } from "zod"
import { zCount, zPage } from "../../util/zod-common"
import { CommonPlayerSchema, zActivity, zActivityPlayer } from "../../util/schema-common"

export const zLeaderboardQueryPagination = z.object({
    count: zCount({ min: 25, max: 100, def: 50 }),
    page: zPage()
})

export const zRaidSchema = z.enum([
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
export type RaidPath = z.infer<typeof zRaidSchema>

export const RaidPathSchema = z.object({
    raid: zRaidSchema
})

export const zIndividualLeaderboardEntry = z
    .object({
        position: z.number(),
        rank: z.number(),
        value: z.number(),
        player: CommonPlayerSchema
    })
    .strict()

export const zWorldFirstLeaderboardEntry = z
    .object({
        position: z.number(),
        rank: z.number(),
        value: z.number(),
        activity: zActivity,
        players: z.array(zActivityPlayer)
    })
    .strict()
