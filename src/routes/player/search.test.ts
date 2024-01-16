import { playerSearchRoute } from "./search"

describe("player search 200", () => {
    const t = async (query: unknown) => {
        const result = await playerSearchRoute.mock({ query })
        expect(result.type).toBe("ok")
    }

    test("partial display name", () =>
        t({
            query: "Ne",
            count: 19
        }))

    test("display name", () =>
        t({
            query: "Newo",
            count: 3
        }))

    test("partial bungie name", () =>
        t({
            query: "Newo#90"
        }))

    test("full bungie name", () =>
        t({
            query: "Newo#9010",
            count: 23
        }))
})
