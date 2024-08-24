import { describe, test } from "bun:test"
import { activityRoute } from "./activity"
import { expectErr, expectOk } from "./testUtil"

describe("activity 200", () => {
    const t = async (instanceId: string) => {
        const result = await activityRoute.$mock({ params: { instanceId } })

        expectOk(result)
    }

    test("6318497407", () => t("6318497407"))

    test("11690445752 -- partial pgcr", () => t("11690445752"))
})

describe("activity 404", () => {
    const t = async (instanceId: string) => {
        const result = await activityRoute.$mock({
            params: {
                instanceId
            }
        })

        expectErr(result)
    }

    test("1", () => t("1"))
})
