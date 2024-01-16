import { leaderboardRaidWorldfirstRoute } from "./worldfirst"

describe("leaderboard worldfirst 200", () => {
    const t = async (raid: string, category: string, query: unknown) => {
        const result = await leaderboardRaidWorldfirstRoute.mock({
            params: { raid, category },
            query
        })
        expect(result.type).toBe("ok")
    }

    test("levi normal", () =>
        t("leviathan", "normal", {
            page: 1,
            count: 32
        }))

    test("spire prestige", () =>
        t("spireofstars", "prestige", {
            page: 3,
            count: 25
        }))

    test("vog challenge", () =>
        t("vaultofglass", "challenge", {
            page: 7,
            count: 27
        }))

    test("vow master", () =>
        t("vowofthedisciple", "master", {
            page: 4,
            count: 87
        }))

    test("dsc duos", () =>
        t("deepstonecrypt", "duos", {
            page: 10,
            count: 78
        }))

    test("ron solos", () =>
        t("rootofnightmares", "solos", {
            page: 43,
            count: 45
        }))
})

describe("leaderboard worldfirst 404", () => {
    const t = async (raid: string, category: string, query: unknown) => {
        const result = await leaderboardRaidWorldfirstRoute.mock({
            params: { raid, category },
            query
        })
        expect(result.type).toBe("err")
    }

    test("levi master", () =>
        t("leviathan", "master", {
            page: 1,
            count: 32
        }))

    test("vog prestige", () =>
        t("vaultofglass", "prestige", {
            page: 3,
            count: 25
        }))

    test("ron challenge", () =>
        t("rootofnightmares", "challenge", {
            page: 7,
            count: 27
        }))
})
