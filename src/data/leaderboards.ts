import { ListedRaid, Raid } from "./raids"
import { Player, PlayerStats, WorldFirstLeaderboardType } from "@prisma/client"

export const WorldFirstBoards = ["normal", "prestige", "challenge", "master"] as const
export type WorldFirstBoard = (typeof WorldFirstBoards)[number]
export const WorldFirstBoardsMap = {
    normal: WorldFirstLeaderboardType.Normal,
    challenge: WorldFirstLeaderboardType.Challenge,
    prestige: WorldFirstLeaderboardType.Prestige,
    master: WorldFirstLeaderboardType.Master
} satisfies Record<WorldFirstBoard, WorldFirstLeaderboardType>

export const IndividualBoards = [
    "fresh",
    "clears",
    "sherpas",
    "trios",
    "duos",
    "solos"
] as const satisfies (keyof PlayerStats)[]
export type IndividualBoard = (typeof IndividualBoards)[number]

export const GlobalBoards = ["clears", "sherpas", "fresh"] as const
export type GlobalBoard = (typeof GlobalBoards)[number]
export const GlobalBoardsMap = {
    clears: "clears",
    fresh: "fullClears",
    sherpas: "sherpas"
} satisfies Record<GlobalBoard, keyof Player>

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

export const ClearsLeaderboardsForRaid = {
    [Raid.LEVIATHAN]: {
        fresh: true,
        sherpas: true,
        clears: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Raid.EATER_OF_WORLDS]: {
        fresh: true,
        sherpas: true,
        clears: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Raid.SPIRE_OF_STARS]: {
        fresh: true,
        sherpas: true,
        clears: true,
        trios: false,
        duos: false,
        solos: false
    },
    [Raid.LAST_WISH]: {
        fresh: false,
        clears: true,
        sherpas: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Raid.SCOURGE_OF_THE_PAST]: {
        fresh: true,
        sherpas: true,
        clears: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Raid.CROWN_OF_SORROW]: {
        sherpas: true,
        fresh: true,
        clears: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Raid.GARDEN_OF_SALVATION]: {
        fresh: true,
        sherpas: true,
        clears: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Raid.DEEP_STONE_CRYPT]: {
        fresh: true,
        sherpas: true,
        clears: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Raid.VAULT_OF_GLASS]: {
        fresh: true,
        sherpas: true,
        clears: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Raid.VOW_OF_THE_DISCIPLE]: {
        fresh: true,
        sherpas: true,
        clears: true,
        trios: true,
        duos: false,
        solos: false
    },
    [Raid.KINGS_FALL]: {
        fresh: true,
        sherpas: true,
        clears: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Raid.ROOT_OF_NIGHTMARES]: {
        fresh: true,
        sherpas: true,
        clears: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Raid.CROTAS_END]: {
        fresh: true,
        sherpas: true,
        clears: true,
        trios: true,
        duos: true,
        solos: false
    }
} satisfies Record<ListedRaid, Record<IndividualBoard, boolean>>

export const IndividualBoardNames: Record<IndividualBoard, string> = {
    fresh: "Full Clears",
    clears: "Clears",
    sherpas: "Sherpas",
    trios: "Trios",
    duos: "Duos",
    solos: "Solos"
}
