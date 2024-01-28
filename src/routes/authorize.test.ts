import { authorizationRoute } from "./authorize"

describe("authorize 200", () => {
    test("admin", async () => {
        const result = await authorizationRoute.mock({
            body: {
                clientSecret: process.env.ADMIN_CLIENT_SECRET
            }
        })

        expect(result.type).toBe("ok")
    })
})

describe("authorize 404", () => {
    test("bad key", async () => {
        const result = await authorizationRoute.mock({
            body: {
                clientSecret: "35djfnsadf2933451241"
            }
        })

        expect(result.type).toBe("err")
    })
})
