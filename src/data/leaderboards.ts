import { WorldFirstLeaderboardType } from "@prisma/client"
import { ListedRaid, Raid } from "./raids"

export const WorldFirstBoards = ["normal", "prestige", "challenge", "master"] as const
export type WorldFirstBoard = (typeof WorldFirstBoards)[number]
export const WorldFirstBoardsMap = [
    ["normal", WorldFirstLeaderboardType.Normal],
    ["challenge", WorldFirstLeaderboardType.Challenge],
    ["prestige", WorldFirstLeaderboardType.Prestige],
    ["master", WorldFirstLeaderboardType.Master]
] satisfies [WorldFirstBoard, WorldFirstLeaderboardType][]

export const IndividualBoards = ["fresh", "total", "sherpas", "trios", "duos", "solos"] as const
export const IndividualClearsBoards = [
    "fresh",
    "total",
    "trios",
    "duos",
    "solos"
] as const satisfies IndividualBoard[]
export type IndividualBoard = (typeof IndividualBoards)[number]

export const GlobalBoards = [
    "total-clears",
    "sherpas",
    "full-clears",
    "cumulative-speedrun"
] as const
export type GlobalBoard = (typeof GlobalBoards)[number]

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

export const WorldFirstLeaderboardsForRaid: Record<ListedRaid, WorldFirstLeaderboardType> = {
    [Raid.LEVIATHAN]: WorldFirstLeaderboardType.Normal,
    [Raid.EATER_OF_WORLDS]: WorldFirstLeaderboardType.Normal,
    [Raid.SPIRE_OF_STARS]: WorldFirstLeaderboardType.Normal,
    [Raid.LAST_WISH]: WorldFirstLeaderboardType.Normal,
    [Raid.SCOURGE_OF_THE_PAST]: WorldFirstLeaderboardType.Normal,
    [Raid.CROWN_OF_SORROW]: WorldFirstLeaderboardType.Normal,
    [Raid.GARDEN_OF_SALVATION]: WorldFirstLeaderboardType.Normal,
    [Raid.DEEP_STONE_CRYPT]: WorldFirstLeaderboardType.Normal,
    [Raid.VAULT_OF_GLASS]: WorldFirstLeaderboardType.Challenge,
    [Raid.VOW_OF_THE_DISCIPLE]: WorldFirstLeaderboardType.Normal,
    [Raid.KINGS_FALL]: WorldFirstLeaderboardType.Challenge,
    [Raid.ROOT_OF_NIGHTMARES]: WorldFirstLeaderboardType.Normal,
    [Raid.CROTAS_END]: WorldFirstLeaderboardType.Challenge
}

export const IndividualClearsLeaderboardsForRaid = {
    [Raid.LEVIATHAN]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Raid.EATER_OF_WORLDS]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Raid.SPIRE_OF_STARS]: {
        fresh: true,
        total: true,
        trios: false,
        duos: false,
        solos: false
    },
    [Raid.LAST_WISH]: {
        fresh: false,
        total: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Raid.SCOURGE_OF_THE_PAST]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Raid.CROWN_OF_SORROW]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Raid.GARDEN_OF_SALVATION]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Raid.DEEP_STONE_CRYPT]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Raid.VAULT_OF_GLASS]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Raid.VOW_OF_THE_DISCIPLE]: {
        fresh: true,
        total: true,
        trios: true,
        duos: false,
        solos: false
    },
    [Raid.KINGS_FALL]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Raid.ROOT_OF_NIGHTMARES]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Raid.CROTAS_END]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: false
    }
} satisfies Record<ListedRaid, Record<(typeof IndividualClearsBoards)[number], boolean>>

export const IndividualBoardNames: Record<IndividualBoard, string> = {
    fresh: "Full",
    total: "Total",
    sherpas: "Sherpas",
    trios: "Trio",
    duos: "Duo",
    solos: "Solo"
}

export const GlobalBoardNames: Record<
    GlobalBoard,
    {
        displayName: string
        format: "number" | "time"
    }
> = {
    "total-clears": {
        displayName: "Total Clears",
        format: "number"
    },
    sherpas: {
        displayName: "Total Sherpas",
        format: "number"
    },
    "full-clears": {
        displayName: "Full Clears",
        format: "number"
    },
    "cumulative-speedrun": {
        displayName: "Cumulative Speedrun",
        format: "time"
    }
}
