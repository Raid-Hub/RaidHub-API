import { z } from "zod"
import { RaidHubRoute } from "../../RaidHubRoute"
import { getWeeklyWeaponMeta } from "../../data/metrics/weekly-weapon-meta"

export const weeklyWeaponMetaRoute = new RaidHubRoute({
    method: "get",
    description: "Get the weekly weapon meta",
    query: z.object({
        sort: z.enum(["usage", "kills"]).optional().default("usage")
    }),
    response: {
        success: {
            statusCode: 200,
            schema: z.array(z.unknown())
        }
    },
    handler: async ({ query }) => {
        const weeklyWeaponMeta = await getWeeklyWeaponMeta(query)
        return RaidHubRoute.ok(weeklyWeaponMeta)
    }
})
