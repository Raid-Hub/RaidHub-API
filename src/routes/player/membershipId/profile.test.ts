import { cleanupPostgresAfterAll, expectErr, expectOk } from "../../testUtil"
import { playerProfileRoute } from "./profile"

cleanupPostgresAfterAll()

describe("player profile 200", () => {
    const t = async (membershipId: string) => {
        const result = await playerProfileRoute.$mock({ params: { membershipId } })
        expectOk(result)
    }

    test("4611686018488107374", () => t("4611686018488107374"))

    test("no clears", () => t("4611686018497002892"))
})

describe("player profile 404", () => {
    const t = async (membershipId: string) => {
        const result = await playerProfileRoute.$mock({
            params: {
                membershipId
            }
        })

        expectErr(result)
    }

    test("1", () => t("1"))
})

describe("player profile 403", () => {
    const t = async (membershipId: string) => {
        const result = await playerProfileRoute.$mock({
            params: {
                membershipId
            }
        })

        expectErr(result)
    }

    test("4611686018467346804", () => t("4611686018467346804"))
})
