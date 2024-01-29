import { activitySearchRoute } from "./search"

describe("activity search 200", () => {
    const t = async (query: unknown) => {
        const result = await activitySearchRoute.$mock({ query })
        expect(result.type).toBe("ok")

        return result
    }

    test("owen and owen, completed & flawless", () =>
        t({
            membershipId: ["4611686018488107374", "4611686018467831285"],
            completed: true,
            flawless: true
        }))

    test("owen and owen, fresh & minSeason", () =>
        t({
            membershipId: ["4611686018488107374", "4611686018467831285"],
            fresh: true,
            minSeason: 7
        }))

    test("owen and owen, maxPlayers & raid", () =>
        t({
            membershipId: ["4611686018488107374", "4611686018467831285"],
            maxPlayers: 2,
            raid: 7
        }))

    test("owen, min players, min date, max date", () =>
        t({
            membershipId: ["4611686018488107374"],
            minPlayers: 3,
            minDate: new Date(Date.now() - 80000000000),
            maxDate: new Date(Date.now() - 10000000000)
        }))

    test("owen, reversed, count, page, platformType", () =>
        t({
            membershipId: ["4611686018488107374"],
            platformType: 3,
            reversed: true,
            count: 5,
            page: 2
        }))

    test("invalid min/max season", () =>
        t({
            membershipId: ["4611686018488107374", "4611686018467831285"],
            raid: 7,
            minSeason: 99,
            maxSeason: 99
        }))
})
