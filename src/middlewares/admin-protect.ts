import { RequestHandler } from "express"
import { adminProtectedError } from "../RaidHubRoute"
import { z } from "zod"

export const adminProtected =
    (prod: boolean): RequestHandler =>
    (req, res, next) => {
        if (
            !prod || // dev mode
            ("x-admin-key" in req.headers && req.headers["x-admin-key"] === process.env.ADMIN_KEY)
        ) {
            next()
        } else {
            res.status(403).json({
                message: "Forbidden",
                minted: new Date(),
                success: false,
                statusCode: 401,
                error: {
                    forbidden: true
                }
            } satisfies z.infer<typeof adminProtectedError>)
        }
    }
