import { z } from "zod"
import { cleanupPostgresAfterAll } from "../../routes/testUtil"
import { zTeammate } from "../../schema/components/Teammate"
import { getTeammates } from "../teammates"

cleanupPostgresAfterAll()

describe("getPlayer", () => {
    it("returns the correct shape", async () => {
        const data = await getTeammates("4611686018443649478", {
            count: 10
        }).catch(console.error)

        const parsed = z.array(zTeammate).safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.data.length).toBeGreaterThan(0)
            expect(parsed.success).toBe(true)
        }
    })
})
