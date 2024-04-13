export const enum Raid {
    NA = 0,
    LEVIATHAN,
    EATER_OF_WORLDS,
    SPIRE_OF_STARS,
    LAST_WISH,
    SCOURGE_OF_THE_PAST,
    CROWN_OF_SORROW,
    GARDEN_OF_SALVATION,
    DEEP_STONE_CRYPT,
    VAULT_OF_GLASS,
    VOW_OF_THE_DISCIPLE,
    KINGS_FALL,
    ROOT_OF_NIGHTMARES,
    CROTAS_END,
    PANTHEON_ATRAKS_SOVEREIGN = 101,
    PANTHEON_ORYX_EXALTED,
    PANTHEON_RHULK_INDOMITABLE,
    PANTHEON_NEZAREC_SUBLIME
}

export const enum Difficulty {
    NA = 0,
    NORMAL = 1,
    GUIDEDGAMES = 2,
    PRESTIGE = 3,
    MASTER = 4,
    CHALLENGE_VOG = 64,
    CHALLENGE_KF = 65,
    CHALLENGE_CROTA = 66,
    PANTHEON = 128
}

export const ListedRaids = [
    Raid.CROTAS_END,
    Raid.ROOT_OF_NIGHTMARES,
    Raid.KINGS_FALL,
    Raid.VOW_OF_THE_DISCIPLE,
    Raid.VAULT_OF_GLASS,
    Raid.DEEP_STONE_CRYPT,
    Raid.GARDEN_OF_SALVATION,
    Raid.LAST_WISH,
    Raid.CROWN_OF_SORROW,
    Raid.SCOURGE_OF_THE_PAST,
    Raid.SPIRE_OF_STARS,
    Raid.EATER_OF_WORLDS,
    Raid.LEVIATHAN
] as const
export type ListedRaid = (typeof ListedRaids)[number]

export const Versions = [
    Difficulty.NORMAL,
    Difficulty.GUIDEDGAMES,
    Difficulty.PRESTIGE,
    Difficulty.MASTER,
    Difficulty.CHALLENGE_VOG,
    Difficulty.CHALLENGE_KF,
    Difficulty.CHALLENGE_CROTA,
    Difficulty.PANTHEON
] as const
export type RaidVersion = (typeof Versions)[number]

export const PantheonModes = [
    Raid.PANTHEON_ATRAKS_SOVEREIGN,
    Raid.PANTHEON_ORYX_EXALTED,
    Raid.PANTHEON_RHULK_INDOMITABLE,
    Raid.PANTHEON_NEZAREC_SUBLIME
] as const
export type PantheonMode = (typeof PantheonModes)[number]

export const SunsetRaids = [
    Raid.LEVIATHAN,
    Raid.EATER_OF_WORLDS,
    Raid.SPIRE_OF_STARS,
    Raid.SCOURGE_OF_THE_PAST,
    Raid.CROWN_OF_SORROW
] as const
export type SunsetRaid = (typeof SunsetRaids)[number]

export const MasterRaids = [
    Raid.VAULT_OF_GLASS,
    Raid.VOW_OF_THE_DISCIPLE,
    Raid.KINGS_FALL,
    Raid.ROOT_OF_NIGHTMARES,
    Raid.CROTAS_END
] as const
export type MasterRaid = (typeof MasterRaids)[number]

export const PrestigeRaids = [Raid.LEVIATHAN, Raid.EATER_OF_WORLDS, Raid.SPIRE_OF_STARS] as const
export type PrestigeRaid = (typeof PrestigeRaids)[number]

export const ContestRaids = [
    Raid.CROWN_OF_SORROW,
    Raid.GARDEN_OF_SALVATION,
    Raid.DEEP_STONE_CRYPT,
    Raid.VAULT_OF_GLASS,
    Raid.VOW_OF_THE_DISCIPLE,
    Raid.KINGS_FALL,
    Raid.ROOT_OF_NIGHTMARES,
    Raid.CROTAS_END
] as const
export type ContestRaid = (typeof ContestRaids)[number]

export const ReprisedRaidDifficultyPairings = [
    [Raid.VAULT_OF_GLASS, Difficulty.CHALLENGE_VOG, "Tempo's Edge"],
    [Raid.KINGS_FALL, Difficulty.CHALLENGE_KF, "Regicide"],
    [Raid.CROTAS_END, Difficulty.CHALLENGE_CROTA, "Superior Swordplay"]
] as const
