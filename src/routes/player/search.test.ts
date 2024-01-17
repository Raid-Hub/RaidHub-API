import { playerSearchRoute } from "./search"

describe("player search 200", () => {
    const t = async (query: unknown) => {
        const result = await playerSearchRoute.mock({ query })
        expect(result.type).toBe("ok")

        return result.parsed
    }

    test("partial display name", async () => {
        const data = await t({
            query: "N",
            count: 19
        })

        expect(data.results.length).toBeGreaterThan(5)
    })

    test("display name", () =>
        t({
            query: "Newo",
            count: 3
        }))

    test("partial bungie name", () =>
        t({
            query: "Newo#90"
        }))

    test("full bungie name", async () => {
        const data = await t({
            query: "Newo#9010",
            count: 23
        })

        expect(data.results).toHaveLength(1)
    })
})
