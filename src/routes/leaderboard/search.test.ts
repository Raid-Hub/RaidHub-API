import { leaderboardSearchRoute } from "./search"

describe("leaderboard search 200", () => {
    const t = async (query: unknown) => {
        const result = await leaderboardSearchRoute.mock({
            query
        })
        expect(result.type).toBe("ok")
    }

    test("individual levi sherpas", () =>
        t({
            count: 50,
            page: 1,
            membershipId: "4611686018488107374",
            type: "individual",
            category: "sherpas",
            raid: 1
        }))

    test("worldfirst vog normal", () =>
        t({
            page: 3,
            membershipId: "4611686018488107374",
            type: "worldfirst",
            category: "normal",
            raid: 9
        }))

    test("global sherpas", () =>
        t({
            count: 25,
            membershipId: "4611686018488107374",
            type: "global",
            category: "sherpas"
        }))

    test("global speed", () =>
        t({
            count: 60,
            page: 7,
            membershipId: "4611686018488107374",
            type: "global",
            category: "speed"
        }))
})

describe("leaderboard search 404", () => {
    const t = async (query: unknown) => {
        const result = await leaderboardSearchRoute.mock({
            query
        })
        expect(result.type).toBe("err")
    }

    test("individual levi sherpas", () =>
        t({
            count: 50,
            page: 7,
            membershipId: "3611686018488107374",
            type: "individual",
            category: "sherpas",
            raid: 1
        }))

    test("worldfirst vog normal", () =>
        t({
            count: 50,
            membershipId: "3611686018488107374",
            type: "worldfirst",
            category: "normal",
            raid: 9,
            page: 3
        }))

    test("global sherpas", () =>
        t({
            count: 50,
            membershipId: "3611686018488107374",
            type: "global",
            category: "sherpas",
            page: 2
        }))

    test("global speed", () =>
        t({
            count: 50,
            membershipId: "3611686018488107374",
            type: "global",
            category: "speed"
        }))
})
