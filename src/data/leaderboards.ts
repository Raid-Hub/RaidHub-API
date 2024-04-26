import { WorldFirstLeaderboardType } from "@prisma/client"
import { PantheonPath } from "../routes/leaderboard/_schema"
import { Activity, ActivityVersion, ListedRaid, PantheonMode } from "./raids"

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
export const IndividualPantheonBoards = ["fresh", "total", "sherpas", "trios", "duos"] as const
export type IndividualBoard = (typeof IndividualBoards)[number]

export const GlobalBoards = [
    "total-clears",
    "sherpas",
    "full-clears",
    "cumulative-speedrun"
] as const
export type GlobalBoard = (typeof GlobalBoards)[number]

export const UrlPathsToRaid = {
    leviathan: Activity.LEVIATHAN,
    eaterofworlds: Activity.EATER_OF_WORLDS,
    spireofstars: Activity.SPIRE_OF_STARS,
    lastwish: Activity.LAST_WISH,
    scourgeofthepast: Activity.SCOURGE_OF_THE_PAST,
    crownofsorrow: Activity.CROWN_OF_SORROW,
    gardenofsalvation: Activity.GARDEN_OF_SALVATION,
    deepstonecrypt: Activity.DEEP_STONE_CRYPT,
    vaultofglass: Activity.VAULT_OF_GLASS,
    vowofthedisciple: Activity.VOW_OF_THE_DISCIPLE,
    kingsfall: Activity.KINGS_FALL,
    rootofnightmares: Activity.ROOT_OF_NIGHTMARES,
    crotasend: Activity.CROTAS_END
} satisfies Record<string, ListedRaid>

export const UrlPathsToPantheonVersion: Record<PantheonPath, PantheonMode> = {
    atraks: ActivityVersion.PANTHEON_ATRAKS_SOVEREIGN,
    oryx: ActivityVersion.PANTHEON_ORYX_EXALTED,
    rhulk: ActivityVersion.PANTHEON_RHULK_INDOMITABLE,
    nezarec: ActivityVersion.PANTHEON_NEZAREC_SUBLIME
}

export const PantheonVersionReleaseDates: Record<PantheonMode, Date> = {
    [ActivityVersion.PANTHEON_ATRAKS_SOVEREIGN]: new Date("April 30, 2024 10:00:00 AM PDT"),
    [ActivityVersion.PANTHEON_ORYX_EXALTED]: new Date("May 7, 2024 10:00:00 AM PDT"),
    [ActivityVersion.PANTHEON_RHULK_INDOMITABLE]: new Date("May 14, 2024 10:00:00 AM PDT"),
    [ActivityVersion.PANTHEON_NEZAREC_SUBLIME]: new Date("May 21, 2024 10:00:00 AM PDT")
}

export const WorldFirstLeaderboardsForRaid: Record<ListedRaid, WorldFirstLeaderboardType> = {
    [Activity.LEVIATHAN]: WorldFirstLeaderboardType.Normal,
    [Activity.EATER_OF_WORLDS]: WorldFirstLeaderboardType.Normal,
    [Activity.SPIRE_OF_STARS]: WorldFirstLeaderboardType.Normal,
    [Activity.LAST_WISH]: WorldFirstLeaderboardType.Normal,
    [Activity.SCOURGE_OF_THE_PAST]: WorldFirstLeaderboardType.Normal,
    [Activity.CROWN_OF_SORROW]: WorldFirstLeaderboardType.Normal,
    [Activity.GARDEN_OF_SALVATION]: WorldFirstLeaderboardType.Normal,
    [Activity.DEEP_STONE_CRYPT]: WorldFirstLeaderboardType.Normal,
    [Activity.VAULT_OF_GLASS]: WorldFirstLeaderboardType.Challenge,
    [Activity.VOW_OF_THE_DISCIPLE]: WorldFirstLeaderboardType.Normal,
    [Activity.KINGS_FALL]: WorldFirstLeaderboardType.Challenge,
    [Activity.ROOT_OF_NIGHTMARES]: WorldFirstLeaderboardType.Normal,
    [Activity.CROTAS_END]: WorldFirstLeaderboardType.Challenge
}

export const IndividualClearsLeaderboardsForRaid = {
    [Activity.LEVIATHAN]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Activity.EATER_OF_WORLDS]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Activity.SPIRE_OF_STARS]: {
        fresh: true,
        total: true,
        trios: false,
        duos: false,
        solos: false
    },
    [Activity.LAST_WISH]: {
        fresh: false,
        total: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Activity.SCOURGE_OF_THE_PAST]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Activity.CROWN_OF_SORROW]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Activity.GARDEN_OF_SALVATION]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Activity.DEEP_STONE_CRYPT]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Activity.VAULT_OF_GLASS]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Activity.VOW_OF_THE_DISCIPLE]: {
        fresh: true,
        total: true,
        trios: true,
        duos: false,
        solos: false
    },
    [Activity.KINGS_FALL]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: false
    },
    [Activity.ROOT_OF_NIGHTMARES]: {
        fresh: true,
        total: true,
        trios: true,
        duos: true,
        solos: true
    },
    [Activity.CROTAS_END]: {
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
