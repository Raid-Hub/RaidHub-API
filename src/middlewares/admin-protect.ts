import { RequestHandler } from "express"
import { adminProtectedError } from "../RaidHubErrors"
import { z } from "../util/zod"

function isAdminAuthorized(key: string | undefined) {
    return key != undefined && key === process.env.ADMIN_KEY
}

export const adminProtected: RequestHandler = (req, res, next) => {
    if (isAdminAuthorized(req.headers["x-admin-key"]?.toString())) {
        next()
    } else {
        res.status(403).json({
            message: "Forbidden",
            minted: new Date(),
            success: false,
            statusCode: 403,
            error: {
                type: "forbidden"
            }
        } satisfies z.infer<typeof adminProtectedError>)
    }
}
