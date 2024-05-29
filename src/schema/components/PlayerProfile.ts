import { z } from "zod"
import { registry } from ".."
import { zBigIntString, zNaturalNumber, zWholeNumber } from "../util"
import { zInstance } from "./Instance"
import { zPlayerInfo } from "./PlayerInfo"

export type PlayerProfileActivityStats = z.infer<typeof zPlayerProfileActivityStats>
export const zPlayerProfileActivityStats = registry.register(
    "PlayerProfileActivityStats",
    z.object({
        activityId: zBigIntString(),
        freshClears: zWholeNumber(),
        clears: zWholeNumber(),
        sherpas: zWholeNumber(),
        trios: zWholeNumber(),
        duos: zWholeNumber(),
        solos: zWholeNumber(),
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

export type PlayerProfileGlobalStats = z.infer<typeof zPlayerProfileGlobalStats>
export const zPlayerProfileGlobalStats = registry.register(
    "PlayerProfileGlobalStats",
    z.object({
        clears: zGlobalStat.nullable(),
        freshClears: zGlobalStat.nullable(),
        sherpas: zGlobalStat.nullable(),
        sumOfBest: zGlobalStat.nullable()
    })
)

export type WorldFirstEntry = z.infer<typeof zWorldFirstEntry>
export const zWorldFirstEntry = registry.register(
    "WorldFirstEntry",
    z.object({
        activityId: zBigIntString(),
        instanceId: zBigIntString(),
        timeAfterLaunch: zWholeNumber(),
        rank: zNaturalNumber()
    })
)

export type PlayerProfile = z.infer<typeof zPlayerProfile>
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
