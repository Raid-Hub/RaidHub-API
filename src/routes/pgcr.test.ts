import { pgcrRoute } from "./pgcr"

describe("pgcr 200", () => {
    const t = async (instanceId: string) => {
        const result = await pgcrRoute.$mock({
            params: {
                instanceId
            }
        })

        expect(result.type).toBe("ok")
    }

    test("13478946450", () => t("13478946450"))

    test("6318497407", () => t("6318497407"))

    test("11690445752 -- partial pgcr", () => t("11690445752"))
})

describe("pgcr 404", () => {
    const t = async (instanceId: string) => {
        const result = await pgcrRoute.$mock({
            params: {
                instanceId
            }
        })

        expect(result.type).toBe("err")
    }

    test("1", () => t("1"))

    test("999999999999", () => t("999999999999"))
})
