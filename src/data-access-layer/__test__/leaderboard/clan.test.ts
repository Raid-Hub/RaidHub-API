import { z } from "zod"
import { cleanupPostgresAfterAll } from "../../../routes/testUtil"
import { zClanLeaderboardEntry } from "../../../schema/components/Clan"
import { getClanLeaderboard } from "../../leaderboard/clan"

cleanupPostgresAfterAll()

describe("getClanLeaderboard", () => {
    it("returns the correct shape", async () => {
        const data = await getClanLeaderboard({
            skip: 0,
            take: 10,
            column: "weighted_contest_score"
        }).catch(console.error)

        const parsed = z.array(zClanLeaderboardEntry).safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.data).toHaveLength(10)
        }
    })
})
