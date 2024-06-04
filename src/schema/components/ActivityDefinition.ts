import { z } from "zod"
import { registry } from ".."
import { zBigIntString, zISODateString, zNaturalNumber } from "../util"

export type ActivityDefinition = z.infer<typeof zActivityDefinition>
export const zActivityDefinition = registry.register(
    "ActivityDefinition",
    z
        .object({
            id: zNaturalNumber(),
            name: z.string(),
            path: z.string(),
            isSunset: z.boolean(),
            isRaid: z.boolean(),
            releaseDate: zISODateString().nullable(),
            dayOneEnd: zISODateString().nullable(),
            contestEnd: zISODateString().nullable(),
            weekOneEnd: zISODateString().nullable(),
            milestoneHash: zBigIntString().nullable()
        })
        .strict()
        .openapi({
            description: "The definition of an activity in the RaidHub database.",
            example: {
                id: 9,
                name: "Vault of Glass",
                path: "vaultofglass",
                isSunset: false,
                isRaid: true,
                releaseDate: new Date("2021-05-22T00:00:00Z"),
                dayOneEnd: new Date("2021-05-23T00:00:00Z"),
                contestEnd: new Date("2021-05-23T00:00:00Z"),
                weekOneEnd: new Date("2021-05-25T00:00:00Z"),
                milestoneHash: "1888320892"
            }
        })
)
