import { RequestHandler } from "express"
import { zInsufficientPermissionsError } from "../RaidHubErrors"

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
            success: false
        } satisfies (typeof zInsufficientPermissionsError)["_input"])
    }
}
