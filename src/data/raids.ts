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
    CROTAS_END
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
    CONTEST = 128
}

/**
 * This constant is where to start when new raid hashes should be added.
 */
export const RaidHashes = {
    [Raid.LEVIATHAN]: {
        [Difficulty.NORMAL]: [
            "2693136600",
            "2693136601",
            "2693136602",
            "2693136603",
            "2693136604",
            "2693136605"
        ] as const,
        [Difficulty.GUIDEDGAMES]: [
            "89727599",
            "287649202",
            "1699948563",
            "1875726950",
            "3916343513",
            "4039317196"
        ] as const,
        [Difficulty.PRESTIGE]: [
            "417231112",
            "508802457",
            "757116822",
            "771164842",
            "1685065161",
            "1800508819",
            "2449714930",
            "3446541099",
            "4206123728",
            "3912437239",
            "3879860661",
            "3857338478"
        ] as const
    },
    [Raid.EATER_OF_WORLDS]: {
        [Difficulty.NORMAL]: ["3089205900"] as const,
        [Difficulty.GUIDEDGAMES]: ["2164432138"] as const,
        [Difficulty.PRESTIGE]: ["809170886"] as const
    },
    [Raid.SPIRE_OF_STARS]: {
        [Difficulty.NORMAL]: ["119944200"] as const,
        [Difficulty.GUIDEDGAMES]: ["3004605630"] as const,
        [Difficulty.PRESTIGE]: ["3213556450"] as const
    },
    [Raid.LAST_WISH]: {
        [Difficulty.NORMAL]: ["2122313384", "2214608157"] as const,
        [Difficulty.GUIDEDGAMES]: ["1661734046"] as const
    },
    [Raid.SCOURGE_OF_THE_PAST]: {
        [Difficulty.NORMAL]: ["548750096"] as const,
        [Difficulty.GUIDEDGAMES]: ["2812525063"] as const
    },
    [Raid.CROWN_OF_SORROW]: {
        [Difficulty.NORMAL]: ["3333172150"] as const,
        [Difficulty.GUIDEDGAMES]: ["960175301"] as const
    },
    [Raid.GARDEN_OF_SALVATION]: {
        [Difficulty.NORMAL]: ["2659723068", "3458480158", "1042180643"] as const,
        [Difficulty.GUIDEDGAMES]: ["2497200493", "3845997235", "3823237780"] as const
    },
    [Raid.DEEP_STONE_CRYPT]: {
        [Difficulty.NORMAL]: ["910380154"] as const,
        [Difficulty.GUIDEDGAMES]: ["3976949817"] as const
    },
    [Raid.VAULT_OF_GLASS]: {
        [Difficulty.NORMAL]: ["3881495763"] as const,
        [Difficulty.GUIDEDGAMES]: ["3711931140"] as const,
        [Difficulty.CHALLENGE_VOG]: ["1485585878"] as const,
        [Difficulty.MASTER]: ["1681562271", "3022541210"] as const
    },
    [Raid.VOW_OF_THE_DISCIPLE]: {
        [Difficulty.NORMAL]: ["1441982566", "2906950631"] as const,
        [Difficulty.GUIDEDGAMES]: ["4156879541"] as const,
        [Difficulty.MASTER]: ["4217492330", "3889634515"] as const
    },
    [Raid.KINGS_FALL]: {
        [Difficulty.NORMAL]: ["1374392663"] as const,
        [Difficulty.GUIDEDGAMES]: ["2897223272"] as const,
        [Difficulty.CHALLENGE_KF]: ["1063970578"] as const,
        [Difficulty.MASTER]: ["2964135793", "3257594522"] as const
    },
    [Raid.ROOT_OF_NIGHTMARES]: {
        [Difficulty.NORMAL]: ["2381413764"] as const,
        [Difficulty.GUIDEDGAMES]: ["1191701339"] as const,
        [Difficulty.MASTER]: ["2918919505"] as const
    },
    [Raid.CROTAS_END]: {
        [Difficulty.NORMAL]: ["4179289725"] as const,
        [Difficulty.GUIDEDGAMES]: ["4103176774"] as const,
        [Difficulty.CHALLENGE_CROTA]: ["156253568"] as const,
        [Difficulty.MASTER]: ["1507509200"] as const
    }
} satisfies Record<ListedRaid, Partial<Record<Difficulty, readonly string[]>>>

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

export const RaidVersions = [
    Difficulty.NORMAL,
    Difficulty.GUIDEDGAMES,
    Difficulty.PRESTIGE,
    Difficulty.MASTER,
    Difficulty.CHALLENGE_VOG,
    Difficulty.CHALLENGE_KF,
    Difficulty.CHALLENGE_CROTA
] as const
export type RaidVersion = (typeof RaidVersions)[number]

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
    [Raid.VAULT_OF_GLASS, Difficulty.CHALLENGE_VOG],
    [Raid.KINGS_FALL, Difficulty.CHALLENGE_KF],
    [Raid.CROTAS_END, Difficulty.CHALLENGE_CROTA]
] as const

export const AllRaidHashes = Object.fromEntries(
    Object.entries(
        RaidHashes as unknown as Record<ListedRaid, Partial<Record<Difficulty, string[]>>>
    )
        .map(([raid, difficultyDict]) =>
            Object.entries(difficultyDict).map(([difficulty, hashes]) =>
                hashes.map(
                    hash =>
                        [
                            hash,
                            {
                                raid: parseInt(raid) as ListedRaid,
                                difficulty: parseInt(difficulty) as Difficulty
                            }
                        ] as const
                )
            )
        )
        .flat(2)
)
