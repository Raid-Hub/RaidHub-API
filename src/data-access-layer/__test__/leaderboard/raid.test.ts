import { z } from "zod"
import { cleanupPostgresAfterAll } from "../../../routes/testUtil"
import { zIndividualLeaderboardEntry } from "../../../schema/components/LeaderboardData"
import {
    getIndividualRaidLeaderboard,
    searchIndividualRaidLeaderboard
} from "../../leaderboard/individual/raid"

cleanupPostgresAfterAll()

describe("getIndividualRaidLeaderboard", () => {
    it("returns the correct shape", async () => {
        const data = await getIndividualRaidLeaderboard({
            raidId: 3,
            skip: 904,
            take: 34,
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

describe("searchIndividualRaidLeaderboard", () => {
    it("returns the correct shape", async () => {
        const data = await searchIndividualRaidLeaderboard({
            raidId: 9,
            take: 10,
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
