import { registry, zActivity, zPlayerInfo, zPlayerWithActivityData } from "../../schema/common"
import { z, zCount, zPage, zPositiveInt } from "../../schema/zod"

export const zLeaderboardQueryPagination = z.object({
    count: zCount({ min: 25, max: 100, def: 50 }),
    page: zPage()
})

export const zRaidPath = registry.register(
    "RaidPath",
    z.enum([
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
)

export type RaidPath = z.infer<typeof zRaidPath>

export const zIndividualLeaderboardEntry = registry.register(
    "IndividualLeaderboardEntry",
    z
        .object({
            position: zPositiveInt(),
            rank: zPositiveInt(),
            value: z.number(),
            player: zPlayerInfo
        })
        .strict()
)

export const zWorldFirstLeaderboardEntry = registry.register(
    "WorldFirstLeaderboardEntry",
    z
        .object({
            position: zPositiveInt(),
            rank: zPositiveInt(),
            value: z.number(),
            activity: zActivity,
            players: z.array(zPlayerWithActivityData)
        })
        .strict()
)
