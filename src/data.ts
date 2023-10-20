export const enum Raid {
    NA = -1,
    LEVIATHAN = 0,
    EATER_OF_WORLDS = 1,
    SPIRE_OF_STARS = 2,
    LAST_WISH = 3,
    SCOURGE_OF_THE_PAST = 4,
    CROWN_OF_SORROW = 5,
    GARDEN_OF_SALVATION = 6,
    DEEP_STONE_CRYPT = 7,
    VAULT_OF_GLASS = 8,
    VOW_OF_THE_DISCIPLE = 9,
    KINGS_FALL = 10,
    ROOT_OF_NIGHTMARES = 11,
    CROTAS_END = 12
}

export type ListedRaid = Exclude<Raid, Raid.NA>

export const enum Difficulty {
    NA = -1,
    NORMAL = 0,
    GUIDEDGAMES = 1,
    PRESTIGE = 2,
    MASTER = 3,
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
