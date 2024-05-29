import jwt from "jsonwebtoken"
import { z } from "zod"
import { RaidHubRoute } from "../../RaidHubRoute"
import { ErrorCode } from "../../schema/errors/ErrorCode"
import { zDigitString, zISODateString } from "../../schema/util"

const TOKEN_EXPIRY = 3600

export const generateJWT = (bungieMembershipId: string) =>
    jwt.sign({ admin: true, bungieMembershipId }, process.env.JWT_SECRET!, {
        expiresIn: TOKEN_EXPIRY
    })

export const adminAuthorizationRoute = new RaidHubRoute({
    method: "post",
    description: "Authorize an admin user. Requires the client secret.",
    body: z.object({
        bungieMembershipId: zDigitString(),
        clientSecret: z.string()
    }),
    response: {
        success: {
            statusCode: 200,
            schema: z.object({
                value: z.string(),
                expires: zISODateString()
            })
        },
        errors: [
            {
                statusCode: 403,
                code: ErrorCode.InvalidClientSecretError,
                schema: z.object({
                    unauthorized: z.literal(true)
                })
            }
        ]
    },
    async handler({ body }) {
        if (body.clientSecret === process.env.CLIENT_SECRET) {
            return RaidHubRoute.ok({
                value: generateJWT(body.bungieMembershipId),
                expires: new Date(Date.now() + TOKEN_EXPIRY * 1000)
            })
        } else {
            return RaidHubRoute.fail(ErrorCode.InvalidClientSecretError, {
                unauthorized: true
            })
        }
    }
})
