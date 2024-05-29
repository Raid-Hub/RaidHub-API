import { z } from "zod"
import { cleanupPostgresAfterAll } from "../../../routes/testUtil"
import { zIndividualLeaderboardEntry } from "../../../schema/components/LeaderboardData"
import {
    getIndividualPantheonLeaderboard,
    searchIndividualPantheonLeaderboard
} from "../../leaderboard/individual/pantheon"

cleanupPostgresAfterAll()

describe("getIndividualPantheonLeaderboard", () => {
    it("returns the correct shape", async () => {
        const data = await getIndividualPantheonLeaderboard({
            versionId: 129,
            skip: 13,
            take: 10,
            column: "clears"
        }).catch(console.error)

        const parsed = z.array(zIndividualLeaderboardEntry).safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.data.length).toBeGreaterThan(0)
            expect(parsed.success).toBe(true)
        }
    })
})

describe("searchIndividualPantheonLeaderboard", () => {
    it("returns the correct shape", async () => {
        const data = await searchIndividualPantheonLeaderboard({
            versionId: 129,
            take: 15,
            column: "clears",
            membershipId: "4611686018488107374"
        }).catch(console.error)

        const parsed = z.array(zIndividualLeaderboardEntry).safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.data.length).toBeGreaterThan(0)
            expect(parsed.success).toBe(true)
        }
    })
})
