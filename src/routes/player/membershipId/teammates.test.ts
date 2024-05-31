import { cleanupPostgresAfterAll, expectErr, expectOk } from "../../testUtil"
import { playerTeammatesRoute } from "./teamates"

cleanupPostgresAfterAll()

describe("teammates 200", () => {
    const t = async (membershipId: string) => {
        const result = await playerTeammatesRoute.$mock({ params: { membershipId } })

        expectOk(result)
    }

    test("4611686018443649478", () => t("4611686018443649478"))
})

describe("teammates 403", () => {
    const t = async (membershipId: string) => {
        const result = await playerTeammatesRoute.$mock({
            params: {
                membershipId
            }
        })

        expectErr(result)
    }

    test("4611686018467346804", () => t("4611686018467346804"))
})

describe("teammates 404", () => {
    const t = async (membershipId: string) => {
        const result = await playerTeammatesRoute.$mock({
            params: {
                membershipId
            }
        })

        expectErr(result)
    }

    test("1", () => t("1"))
})
