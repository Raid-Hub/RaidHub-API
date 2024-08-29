import { z } from "zod"
import { registry } from ".."
import { zInt64, zNaturalNumber, zWholeNumber } from "../util"
import { zInstance } from "./Instance"
import { zPlayerInfo } from "./PlayerInfo"

export type PlayerProfileActivityStats = z.input<typeof zPlayerProfileActivityStats>
export const zPlayerProfileActivityStats = registry.register(
    "PlayerProfileActivityStats",
    z.object({
        activityId: zNaturalNumber(),
        freshClears: zWholeNumber(),
        clears: zWholeNumber(),
        sherpas: zWholeNumber(),
        fastestInstance: zInstance.nullable()
    })
)

export const zGlobalStat = registry.register(
    "GlobalStat",
    z.object({
        rank: zNaturalNumber(),
        value: zWholeNumber()
    })
)

export type PlayerProfileGlobalStats = z.input<typeof zPlayerProfileGlobalStats>
export const zPlayerProfileGlobalStats = registry.register(
    "PlayerProfileGlobalStats",
    z.object({
        clears: zGlobalStat.nullable(),
        freshClears: zGlobalStat.nullable(),
        sherpas: zGlobalStat.nullable(),
        sumOfBest: zGlobalStat.nullable()
    })
)

export type WorldFirstEntry = z.input<typeof zWorldFirstEntry>
export const zWorldFirstEntry = registry.register(
    "WorldFirstEntry",
    z.object({
        activityId: zNaturalNumber(),
        instanceId: zInt64(),
        timeAfterLaunch: zWholeNumber(),
        rank: zNaturalNumber(),
        isDayOne: z.boolean(),
        isContest: z.boolean(),
        isWeekOne: z.boolean(),
        isChallengeMode: z.boolean()
    })
)

export type PlayerProfile = z.input<typeof zPlayerProfile>
export const zPlayerProfile = registry.register(
    "PlayerProfile",
    z.object({
        playerInfo: zPlayerInfo,
        stats: z.object({
            global: zPlayerProfileGlobalStats,
            activity: z.record(zPlayerProfileActivityStats)
        }),
        worldFirstEntries: z.record(zWorldFirstEntry.nullable())
    })
)
