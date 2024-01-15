import { z } from "zod"
import { zCount, zPage } from "util/zod-common"
import { UrlPathsToRaid } from "~/data/leaderboards"

export const zLeaderboardQueryPagination = z.object({
    count: zCount({ min: 25, max: 100, def: 50 }),
    page: zPage()
})

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
