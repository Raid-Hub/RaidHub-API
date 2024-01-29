import jwt from "jsonwebtoken"
import { RaidHubRoute } from "../RaidHubRoute"
import { ErrorCode } from "../schema/common"
import { z } from "../schema/zod"
import { fail, ok } from "../util/response"

export function generateJWT() {
    return jwt.sign({ admin: true }, process.env.JWT_SECRET!, { expiresIn: 3600 })
}

export const authorizationRoute = new RaidHubRoute({
    method: "post",
    body: z.object({
        clientSecret: z.string()
    }),
    async handler({ body }) {
        if (body.clientSecret === process.env.ADMIN_CLIENT_SECRET) {
            return ok({
                token: generateJWT()
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
                token: z.string()
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