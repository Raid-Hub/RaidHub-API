import { expectErr, expectOk } from "../testUtil"
import { adminAuthorizationRoute } from "./admin"

describe("authorize 200", () => {
    test("admin", async () => {
        const result = await adminAuthorizationRoute.$mock({
            body: {
                clientSecret: process.env.CLIENT_SECRET,
                bungieMembershipId: "1234567890"
            }
        })

        expectOk(result)
    })
})

describe("authorize 403", () => {
    test("bad key", async () => {
        const result = await adminAuthorizationRoute.$mock({
            body: {
                clientSecret: "35djfnsadf2933451241",
                bungieMembershipId: "1234567890"
            }
        })

        expectErr(result)
    })
})
