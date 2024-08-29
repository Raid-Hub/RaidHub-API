import { z } from "zod"
import { RaidHubRoute } from "../../RaidHubRoute"
import { getWeeklyWeaponMeta } from "../../data/metrics/weekly-weapon-meta"
import { zWeaponMetric } from "../../schema/components/Metrics"
import { zISODateString, zNaturalNumber } from "../../schema/util"

const weekOne = new Date("2017-09-05T17:00:00Z")

export const weeklyWeaponMetaRoute = new RaidHubRoute({
    method: "get",
    description: "Get the weekly weapon meta",
    query: z.object({
        sort: z.enum(["usage", "kills"]).optional().default("usage"),
        date: z
            .date()
            .optional()
            .default(() => new Date())
            .openapi({
                description:
                    "For best performance, using the start of the Destiny week as the date param, or leave it blank"
            })
    }),
    response: {
        success: {
            statusCode: 200,
            schema: z.object({
                weapons: z.array(zWeaponMetric),
                weekStart: zISODateString(),
                weekNumber: zNaturalNumber()
            })
        }
    },
    handler: async ({ query }) => {
        const { metrics, weekStart } = await getWeeklyWeaponMeta(query)
        const weekNumber = Math.floor((weekStart.getTime() - weekOne.getTime()) / 604_800_000) + 1

        return RaidHubRoute.ok({
            weapons: metrics,
            weekNumber: weekNumber,
            weekStart
        })
    }
})
