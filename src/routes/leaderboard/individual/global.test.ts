import { cleanupPostgresAfterAll, expectErr, expectOk } from "../../testUtil"
import { leaderboardIndividualGlobalRoute } from "./global"

cleanupPostgresAfterAll()

describe("global leaderboard 200", () => {
    const t = async (
        params: { category: string },
        query?: { count?: number; search?: string; page?: number }
    ) => {
        const result = await leaderboardIndividualGlobalRoute.$mock({ params, query })

        expectOk(result)
        expect(result.parsed.entries.length).toBeGreaterThan(0)
    }

    test("clears", () =>
        t(
            {
                category: "clears"
            },
            {
                count: 10,
                page: 1
            }
        ))

    test("sherpas", () =>
        t(
            {
                category: "sherpas"
            },
            {
                count: 14,
                page: 4
            }
        ))

    test("search", () =>
        t(
            {
                category: "clears"
            },
            {
                count: 10,
                search: "4611686018488107374"
            }
        ))
})

describe("global leaderboard 404", () => {
    test("player not found", async () => {
        const result = await leaderboardIndividualGlobalRoute.$mock({
            params: {
                category: "clears"
            },
            query: {
                count: 10,
                search: "123"
            }
        })

        expectErr(result)
    })
})
