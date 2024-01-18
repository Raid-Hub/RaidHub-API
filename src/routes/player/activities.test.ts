import { playerActivitiesRoute } from "./activities"

describe("player activities 200", () => {
    const t = async (membershipId: string) => {
        const result = await playerActivitiesRoute.mock({ params: { membershipId } })
        expect(result.type).toBe("ok")
    }

    test("4611686018488107374", () => t("4611686018467831285"))

    test("4611686018467831285", () => t("4611686018467831285"))
})

describe("player activities 404", () => {
    const t = async (membershipId: string) => {
        const result = await playerActivitiesRoute.mock({
            params: {
                membershipId
            }
        })

        expect(result.type).toBe("err")
    }

    test("1", () => t("1"))

    test("4711686018488107374", () => t("4711686018488107374"))
})
