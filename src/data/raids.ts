export const enum Activity {
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
    THE_PANTHEON = 101
}

export const enum ActivityVersion {
    NA = 0,
    NORMAL = 1,
    GUIDEDGAMES,
    PRESTIGE,
    MASTER,
    CHALLENGE_VOG = 64,
    CHALLENGE_KF,
    CHALLENGE_CROTA,
    PANTHEON_ATRAKS_SOVEREIGN = 128,
    PANTHEON_ORYX_EXALTED,
    PANTHEON_RHULK_INDOMITABLE,
    PANTHEON_NEZAREC_SUBLIME
}

export const ListedRaids = [
    Activity.CROTAS_END,
    Activity.ROOT_OF_NIGHTMARES,
    Activity.KINGS_FALL,
    Activity.VOW_OF_THE_DISCIPLE,
    Activity.VAULT_OF_GLASS,
    Activity.DEEP_STONE_CRYPT,
    Activity.GARDEN_OF_SALVATION,
    Activity.LAST_WISH,
    Activity.CROWN_OF_SORROW,
    Activity.SCOURGE_OF_THE_PAST,
    Activity.SPIRE_OF_STARS,
    Activity.EATER_OF_WORLDS,
    Activity.LEVIATHAN
] as const
export type ListedRaid = (typeof ListedRaids)[number]

export const RaidVersions = [
    ActivityVersion.NORMAL,
    ActivityVersion.GUIDEDGAMES,
    ActivityVersion.PRESTIGE,
    ActivityVersion.MASTER,
    ActivityVersion.CHALLENGE_VOG,
    ActivityVersion.CHALLENGE_KF,
    ActivityVersion.CHALLENGE_CROTA
] as const
export type RaidVersion = (typeof RaidVersions)[number]

export const PantheonModes = [
    ActivityVersion.PANTHEON_ATRAKS_SOVEREIGN,
    ActivityVersion.PANTHEON_ORYX_EXALTED,
    ActivityVersion.PANTHEON_RHULK_INDOMITABLE,
    ActivityVersion.PANTHEON_NEZAREC_SUBLIME
] as const
export type PantheonMode = (typeof PantheonModes)[number]

export const SunsetRaids = [
    Activity.LEVIATHAN,
    Activity.EATER_OF_WORLDS,
    Activity.SPIRE_OF_STARS,
    Activity.SCOURGE_OF_THE_PAST,
    Activity.CROWN_OF_SORROW
] as const
export type SunsetRaid = (typeof SunsetRaids)[number]

export const MasterRaids = [
    Activity.VAULT_OF_GLASS,
    Activity.VOW_OF_THE_DISCIPLE,
    Activity.KINGS_FALL,
    Activity.ROOT_OF_NIGHTMARES,
    Activity.CROTAS_END
] as const
export type MasterRaid = (typeof MasterRaids)[number]

export const PrestigeRaids = [
    Activity.LEVIATHAN,
    Activity.EATER_OF_WORLDS,
    Activity.SPIRE_OF_STARS
] as const
export type PrestigeRaid = (typeof PrestigeRaids)[number]

export const ContestRaids = [
    Activity.CROWN_OF_SORROW,
    Activity.GARDEN_OF_SALVATION,
    Activity.DEEP_STONE_CRYPT,
    Activity.VAULT_OF_GLASS,
    Activity.VOW_OF_THE_DISCIPLE,
    Activity.KINGS_FALL,
    Activity.ROOT_OF_NIGHTMARES,
    Activity.CROTAS_END
] as const
export type ContestRaid = (typeof ContestRaids)[number]

export const ReprisedRaidDifficultyPairings = [
    [Activity.VAULT_OF_GLASS, ActivityVersion.CHALLENGE_VOG, "Tempo's Edge"],
    [Activity.KINGS_FALL, ActivityVersion.CHALLENGE_KF, "Regicide"],
    [Activity.CROTAS_END, ActivityVersion.CHALLENGE_CROTA, "Superior Swordplay"]
] as const
