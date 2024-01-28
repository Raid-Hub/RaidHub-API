import jwt from "jsonwebtoken"
import { RaidHubRoute } from "../RaidHubRoute"
import { z } from "../schema/zod"
import { fail, ok } from "../util/response"

export const authorizationRoute = new RaidHubRoute({
    method: "post",
    body: z.object({
        clientSecret: z.string()
    }),
    async handler({ body }) {
        if (body.clientSecret === process.env.ADMIN_CLIENT_SECRET) {
            return ok({
                token: jwt.sign({ admin: true }, process.env.JWT_SECRET!, { expiresIn: 3600 })
            })
        } else {
            return fail({
                unauthorized: true
            })
        }
    },
    response: {
        success: z.object({
            token: z.string()
        }),
        error: z.object({
            unauthorized: z.literal(true)
        })
    }
})
