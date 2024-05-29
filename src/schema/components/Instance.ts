import { z } from "zod"
import { registry } from ".."
import { zDestinyMembershipType } from "../enums/DestinyMembershipType"
import { zBigIntString, zISODateString, zNaturalNumber, zWholeNumber } from "../util"

export type Instance = z.infer<typeof zInstance>
export const zInstance = registry.register(
    "Instance",
    z
        .object({
            instanceId: zBigIntString(),
            hash: zBigIntString(),
            activityId: zNaturalNumber(),
            versionId: zNaturalNumber(),
            completed: z.boolean(),
            flawless: z.boolean().nullable(),
            fresh: z.boolean().nullable(),
            playerCount: zNaturalNumber(),
            dateStarted: zISODateString(),
            dateCompleted: zISODateString(),
            duration: zNaturalNumber().openapi({
                description: "Activity duration in seconds"
            }),
            platformType: zDestinyMembershipType.openapi({
                description:
                    "If all players are on the same platform, this will be the platform type. Otherwise, it will be `0`."
            }),
            score: zWholeNumber()
        })
        .strict()
)
