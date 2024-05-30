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
            score: zWholeNumber(),
            dateStarted: zISODateString(),
            dateCompleted: zISODateString(),
            duration: zNaturalNumber().openapi({
                description: "Activity duration in seconds"
            }),
            platformType: zDestinyMembershipType.openapi({
                description:
                    "If all players are on the same platform, this will be the platform type. Otherwise, it will be `0`."
            }),
            isDayOne: z.boolean().openapi({
                description: "If the activity was completed before the day one end date"
            }),
            isContest: z.boolean().openapi({
                description: "If the activity was completed before the contest end date"
            }),
            isWeekOne: z.boolean().openapi({
                description: "If the activity was completed before the week one end date"
            })
        })
        .strict()
)
