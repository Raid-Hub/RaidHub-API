import { z } from "zod"
import { registry } from ".."
import { zBigIntString, zISODateString, zNaturalNumber, zWholeNumber } from "../util"

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
        lastUpdated: zISODateString()
    })
)

export type ClanLeaderboardEntry = z.infer<typeof zClanLeaderboardEntry>
export const zClanLeaderboardEntry = registry.register(
    "ClanLeaderboardEntry",
    z.object({
        clan: zClan,
        knownMemberCount: zNaturalNumber(),
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
