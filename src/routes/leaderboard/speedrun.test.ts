import { leaderboardSpeedrunRoute } from "./speedrun"

describe("leaderboard speedrun 200", () => {
    const t = async (raid: string, query: unknown) => {
        const result = await leaderboardSpeedrunRoute.$mock({
            params: { raid },
            query
        })
        expect(result.type).toBe("ok")
    }

    test("leviathan", () =>
        t("leviathan", {
            page: 1,
            count: 32
        }))

    test("eater of worlds", () =>
        t("eaterofworlds", {
            page: 3,
            count: 25
        }))

    test("vault of glass", () =>
        t("vaultofglass", {
            page: 7,
            count: 27
        }))

    test("king's fall", () =>
        t("vowofthedisciple", {
            page: 4,
            count: 87
        }))

    test("crown of sorrow", () =>
        t("crownofsorrow", {
            page: 9,
            count: 33
        }))
})
