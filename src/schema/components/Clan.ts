import { z } from "zod"
import { registry } from ".."
import { zBigIntString, zISODateString, zNaturalNumber, zWholeNumber } from "../util"
import { zPlayerInfo } from "./PlayerInfo"

export type ClanBannerData = z.infer<typeof zClanBannerData>
export const zClanBannerData = registry.register(
    "ClanBannerData",
    z
        .object({
            decalId: zWholeNumber(),
            decalColorId: zWholeNumber(),
            decalBackgroundColorId: zWholeNumber(),
            gonfalonId: zWholeNumber(),
            gonfalonColorId: zWholeNumber(),
            gonfalonDetailId: zWholeNumber(),
            gonfalonDetailColorId: zWholeNumber()
        })
        .strict()
)

export type Clan = z.infer<typeof zClan>
export const zClan = registry.register(
    "Clan",
    z.object({
        groupId: zBigIntString(),
        name: z.string(),
        callSign: z.string(),
        motto: z.string(),
        clanBannerData: zClanBannerData,
        lastUpdated: zISODateString(),
        knownMemberCount: zNaturalNumber()
    })
)

export type ClanAggregateStats = z.infer<typeof zClanAggregateStats>
export const zClanAggregateStats = registry.register(
    "ClanAggregateStats",
    z.object({
        clears: zWholeNumber(),
        averageClears: zWholeNumber(),
        freshClears: zWholeNumber(),
        averageFreshClears: zWholeNumber(),
        sherpas: zWholeNumber(),
        averageSherpas: zWholeNumber(),
        timePlayedSeconds: zWholeNumber(),
        averageTimePlayedSeconds: zWholeNumber(),
        totalContestScore: z.number().nonnegative(),
        weightedContestScore: z.number().nonnegative()
    })
)

export type ClanLeaderboardEntry = z.infer<typeof zClanLeaderboardEntry>
export const zClanLeaderboardEntry = registry.register(
    "ClanLeaderboardEntry",
    z
        .object({
            clan: zClan
        })
        .merge(zClanAggregateStats)
)

export type ClanMemberStats = z.infer<typeof zClanMemberStats>
export const zClanMemberStats = registry.register(
    "ClanMemberStats",
    z.object({
        clears: zWholeNumber(),
        freshClears: zWholeNumber(),
        sherpas: zWholeNumber(),
        totalTimePlayedSeconds: zWholeNumber(),
        contestScore: z.number().nonnegative()
    })
)

export type ClanStats = z.infer<typeof zClanStats>
export const zClanStats = registry.register(
    "ClanStats",
    z.object({
        aggregateStats: zClanAggregateStats,
        members: z.array(
            z.object({
                playerInfo: zPlayerInfo.nullable(),
                stats: zClanMemberStats
            })
        )
    })
)
