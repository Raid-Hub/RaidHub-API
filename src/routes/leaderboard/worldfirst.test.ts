import { leaderboardRaidWorldfirstRoute } from "./worldfirst"

describe("leaderboard worldfirst 200", () => {
    const t = async (raid: string, category: string, query: unknown) => {
        const result = await leaderboardRaidWorldfirstRoute.$mock({
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

    test("leaderboards are in order", async () => {
        const { parsed } = await leaderboardRaidWorldfirstRoute.$mock({
            params: { raid: "rootofnightmares", category: "normal" },
            query: {
                page: 1,
                count: 100
            }
        })

        parsed.entries.forEach((entry: any, idx: number) => {
            expect(entry.position).toEqual(idx + 1)
        })
    })
})

describe("leaderboard worldfirst 404", () => {
    const t = async (raid: string, category: string, query: unknown) => {
        const result = await leaderboardRaidWorldfirstRoute.$mock({
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
