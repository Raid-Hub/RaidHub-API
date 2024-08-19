import { cleanupPostgresAfterAll } from "../../routes/testUtil"
import { zClanLeaderboardEntry } from "../../schema/components/Clan"
import { getClanStats } from "../clan"

cleanupPostgresAfterAll()

describe("getClanStats", () => {
    it("returns the correct shape", async () => {
        const data = await getClanStats("3148408").catch(console.error)

        const parsed = zClanLeaderboardEntry.safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.success).toBe(true)
        }
    })
})
