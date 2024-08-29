import { describe, expect, test } from "bun:test"
import { expectOk } from "../../util.test"
import { weeklyWeaponMetaRoute } from "./weeklyWeaponMeta"

describe("weekly weapon meta 200", () => {
    const t = async (query: unknown) => {
        const result = await weeklyWeaponMetaRoute.$mock({ query })

        expectOk(result)

        if (result.type === "err") {
            throw new Error("expected parsed response")
        } else {
            return result.parsed
        }
    }

    test("2024-08-29", async () => {
        const data = await t({
            sort: "kills",
            date: "2024-08-29T17:31:06.812Z"
        })

        expect(data.weapons.length).toBe(100)
        expect(data.weekNumber).toBe(365)
        expect(data.weekStart.toISOString()).toBe("2024-08-27T17:00:00.000Z")
    })

    test("2021-07-07", async () => {
        const data = await t({
            sort: "usage",
            date: "2021-07-07T08:02:00.567Z"
        })

        expect(data.weapons.length).toBe(100)
        expect(data.weekNumber).toBe(201)
        expect(data.weekStart.toISOString()).toBe("2021-07-06T17:00:00.000Z")
    })
})
