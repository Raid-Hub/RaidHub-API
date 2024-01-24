import { z } from "zod"
import { zBigIntString } from "./zod-common"

export const CommonPlayerSchema = z
    .object({
        membershipId: zBigIntString(),
        membershipType: z.number().nullable(),
        iconPath: z.string().nullable(),
        displayName: z.string().nullable(),
        bungieGlobalDisplayName: z.string().nullable(),
        bungieGlobalDisplayNameCode: z.string().nullable()
    })
    .strict()

export const zActivity = z.object({
    instanceId: zBigIntString(),
    raidHash: zBigIntString(),
    completed: z.boolean(),
    flawless: z.boolean().nullable(),
    fresh: z.boolean().nullable(),
    playerCount: z.number().int().positive(),
    dateStarted: z.date(),
    dateCompleted: z.date(),
    duration: z.number(),
    platformType: z.number().int()
})

export const zActivityPlayerData = z
    .object({
        finishedRaid: z.boolean(),
        kills: z.number().int(),
        assists: z.number().int(),
        deaths: z.number().int(),
        timePlayedSeconds: z.number().int(),
        classHash: zBigIntString().nullable(),
        sherpas: z.number().int(),
        isFirstClear: z.boolean()
    })
    .strict()

export const zActivityPlayer = CommonPlayerSchema.extend({
    data: zActivityPlayerData
}).strict()
