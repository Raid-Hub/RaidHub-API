import { z } from "zod"
import { cleanupPostgresAfterAll } from "../../../routes/testUtil"
import { zTeamLeaderboardEntry } from "../../../schema/components/LeaderboardData"
import {
    getFirstTeamActivityVersionLeaderboard,
    searchFirstTeamActivityVersionLeaderboard
} from "../../leaderboard/team/first"

cleanupPostgresAfterAll()

describe("getFirstTeamActivityVersionLeaderboard", () => {
    it("returns the correct shape", async () => {
        const data = await getFirstTeamActivityVersionLeaderboard({
            activityId: 3,
            versionId: 3,
            skip: 76,
            take: 13
        }).catch(console.error)

        const parsed = z.array(zTeamLeaderboardEntry).safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.data.length).toBeGreaterThan(0)
            expect(parsed.success).toBe(true)
        }
    })
})

describe("searchFirstTeamActivityVersionLeaderboard", () => {
    it("returns the correct shape", async () => {
        const data = await searchFirstTeamActivityVersionLeaderboard({
            activityId: 12,
            versionId: 4,
            take: 16,
            membershipId: "4611686018517984145"
        }).catch(console.error)

        const parsed = z.array(zTeamLeaderboardEntry).safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.data.length).toBeGreaterThan(0)
            expect(parsed.success).toBe(true)
        }
    })
})
