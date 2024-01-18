import { leaderboardRaidIndividualRoute } from "./individual"

describe("leaderboard individual 200", () => {
    const t = async (raid: string, category: string, query: unknown) => {
        const result = await leaderboardRaidIndividualRoute.mock({
            params: { raid, category },
            query
        })
        expect(result.type).toBe("ok")
    }

    test("levi sherpas", () =>
        t("leviathan", "sherpas", {
            page: 1,
            count: 32
        }))

    test("gos fresh", () =>
        t("gardenofsalvation", "fresh", {
            page: 3,
            count: 25
        }))

    test("wish clears", () =>
        t("lastwish", "clears", {
            page: 7,
            count: 27
        }))

    test("sotp trios", () =>
        t("scourgeofthepast", "trios", {
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
