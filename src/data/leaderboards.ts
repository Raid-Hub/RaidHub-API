import { z } from "zod"
import { includedIn } from "~/util"
import { ListedRaid, Raid } from "./raids"
import { Player, PlayerStats } from "@prisma/client"

export const Boards = ["normal", "prestige", "pc", "challenge", "master"] as const
export type Board = (typeof Boards)[number]

export const IndividualBoards = [
    "fresh",
    "clears",
    "sherpas",
    "trios",
    "duos",
    "solos"
] as const satisfies (keyof PlayerStats)[]
export type IndividualBoard = (typeof IndividualBoards)[number]

const RaidPathSchema = z.object({
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

const GlobalBoards = ["clears", "sherpas", "fresh"] as const
export type GlobalBoard = (typeof GlobalBoards)[number]

export const GlobalBoardsMap = {
    clears: "clears",
    fresh: "fullClears",
    sherpas: "sherpas"
} satisfies Record<GlobalBoard, keyof Player>

export const GlobalLeaderboardParams = z.object({
    category: z.enum(GlobalBoards).transform(s => GlobalBoardsMap[s])
})

export const IndividualLeaderboardParams = RaidPathSchema.extend({
    category: z
        .string()
        .transform(s => s.toLowerCase())
        .pipe(z.enum(IndividualBoards))
}).refine(
    schema => includedIn(Object.keys(ClearsLeaderboardsForRaid[schema.raid]), schema.category),
    "This leaderboard is not available for this raid"
)

export const ActivityLeaderboardParams = RaidPathSchema.extend({
    category: z.enum(Boards)
}).refine(
    schema => includedIn(Object.keys(LeaderboardsForRaid[schema.raid]), schema.category),
    "This leaderboard is not available for this raid"
)

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

export const LeaderboardsForRaid = {
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

export const ClearsLeaderboardsForRaid = {
    [Raid.LEVIATHAN]: {
        clears: true,
        fresh: true,
        sherpas: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Raid.EATER_OF_WORLDS]: {
        clears: true,
        fresh: true,
        sherpas: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Raid.SPIRE_OF_STARS]: {
        clears: true,
        fresh: true,
        sherpas: true,
        trios: false,
        duos: false,
        solos: false
    },
    [Raid.LAST_WISH]: {
        clears: true,
        fresh: true,
        sherpas: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Raid.SCOURGE_OF_THE_PAST]: {
        clears: true,
        fresh: true,
        sherpas: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Raid.CROWN_OF_SORROW]: {
        clears: true,
        fresh: true,
        sherpas: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Raid.GARDEN_OF_SALVATION]: {
        clears: true,
        fresh: true,
        sherpas: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Raid.DEEP_STONE_CRYPT]: {
        clears: true,
        fresh: true,
        sherpas: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Raid.VAULT_OF_GLASS]: {
        clears: true,
        fresh: true,
        sherpas: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Raid.VOW_OF_THE_DISCIPLE]: {
        clears: true,
        fresh: true,
        sherpas: true,
        trios: true,
        duos: false,
        solos: false
    },
    [Raid.KINGS_FALL]: {
        clears: true,
        fresh: true,
        sherpas: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Raid.ROOT_OF_NIGHTMARES]: {
        clears: true,
        fresh: true,
        sherpas: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Raid.CROTAS_END]: {
        clears: true,
        fresh: true,
        sherpas: true,
        trios: true,
        duos: true,
        solos: false
    }
} satisfies Record<ListedRaid, Record<IndividualBoard, boolean>>
