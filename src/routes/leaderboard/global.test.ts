import { leaderboardGlobalRoute } from "./global"

describe("leaderboard global 200", () => {
    const t = async (category: string, query: unknown) => {
        const result = await leaderboardGlobalRoute.$mock({ params: { category }, query })
        expect(result.type).toBe("ok")
    }

    test("sherpas", () =>
        t("sherpas", {
            page: 1,
            count: 25
        }))

    test("total-clears", () =>
        t("total-clears", {
            page: 23,
            count: 77
        }))

    test("full-clears", () =>
        t("full-clears", {
            page: 4,
            count: 45
        }))

    test("cumulative-speedrun", () =>
        t("cumulative-speedrun", {
            page: 5,
            count: 45
        }))
})
