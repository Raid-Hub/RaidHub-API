import jwt from "jsonwebtoken"
import { RaidHubRoute } from "../RaidHubRoute"
import { ErrorCode } from "../schema/common"
import { z, zISODateString } from "../schema/zod"
import { fail, ok } from "../util/response"

const TOKEN_EXPIRY = 3600

export function generateJWT() {
    return jwt.sign({ admin: true }, process.env.JWT_SECRET!, { expiresIn: TOKEN_EXPIRY })
}

export const authorizationRoute = new RaidHubRoute({
    method: "post",
    body: z.object({
        clientSecret: z.string()
    }),
    async handler({ body }) {
        if (body.clientSecret === process.env.ADMIN_CLIENT_SECRET) {
            return ok({
                value: generateJWT(),
                expires: new Date(Date.now() + TOKEN_EXPIRY * 1000)
            })
        } else {
            return fail(
                {
                    unauthorized: true
                },
                ErrorCode.InvalidClientSecretError
            )
        }
    },
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
                type: ErrorCode.InvalidClientSecretError,
                schema: z.object({
                    unauthorized: z.literal(true)
                })
            }
        ]
    }
})
