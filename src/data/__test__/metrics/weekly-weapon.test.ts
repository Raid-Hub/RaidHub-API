import { describe, expect, it } from "bun:test"
import { z } from "zod"
import { zWeaponMetric } from "../../../schema/components/Metrics"
import { getWeeklyWeaponMeta } from "../../metrics/weekly-weapon-meta"

describe("getWeeklyWeaponMeta", () => {
    it("returns the correct shape", async () => {
        const data = await getWeeklyWeaponMeta({
            sort: "usage",
            date: new Date()
        })

        const parsed = z
            .object({
                metrics: z.array(zWeaponMetric),
                weekStart: z.date()
            })
            .safeParse(data)
        if (!parsed.success) {
            console.error(parsed.error.errors)
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.success).toBe(true)
        }
    })
})
