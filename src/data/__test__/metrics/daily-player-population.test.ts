import { describe, expect, it } from "bun:test"
import { z } from "zod"
import { zPopulationByRaidMetric } from "../../../schema/components/Metrics"
import { zISODateString } from "../../../schema/util"
import { getDailyPlayerPopulation } from "../../metrics/daily-player-population"

describe("getDailyPlayerPopulation", () => {
    it("returns the correct shape", async () => {
        const data = await getDailyPlayerPopulation()

        const parsed = z
            .array(
                z.object({
                    hour: zISODateString(),
                    population: zPopulationByRaidMetric
                })
            )
            .safeParse(data)
        if (!parsed.success) {
            console.error(parsed.error.errors)
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.success).toBe(true)
        }
    })
})
