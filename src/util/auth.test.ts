import jwt from "jsonwebtoken"
import { canAccessPrivateProfile, generateJWT } from "./auth"

describe("auth", () => {
    it("should generate a valid JWT token", async () => {
        const token = generateJWT(
            {
                isAdmin: false,
                bungieMembershipId: "123",
                destinyMembershipIds: ["4611686018467346804"]
            },
            1
        )

        expect(token).toBeTruthy()

        jwt.verify(token, process.env.JWT_SECRET!, (err, result) => {
            expect(err).toBeNull()
            expect(result).toMatchObject({
                isAdmin: false,
                bungieMembershipId: "123",
                destinyMembershipIds: ["4611686018467346804"]
            })
        })

        canAccessPrivateProfile("4611686018467346804", `Bearer ${token}`).then(result => {
            expect(result).toBe(true)
        })

        canAccessPrivateProfile("4611686018467346803", `Bearer ${token}`).then(result => {
            expect(result).toBe(false)
        })

        await new Promise<void>(resolve => {
            setTimeout(() => {
                canAccessPrivateProfile("4611686018467346804", `Bearer ${token}`).then(result => {
                    expect(result).toBe(false)
                })
                resolve()
            }, 2000)
        })
    })

    it("does not work with invalid secret", async () => {
        const token = generateJWT(
            {
                isAdmin: false,
                bungieMembershipId: "123",
                destinyMembershipIds: ["4611686018467346804"]
            },
            1
        )

        expect(token).toBeTruthy()

        jwt.verify(token, "invalid", (err, result) => {
            expect(err).toBeTruthy()
            expect(result).toBeUndefined()
        })
    })
})
