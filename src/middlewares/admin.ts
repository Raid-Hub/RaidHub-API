import { RequestHandler } from "express"
import jwt from "jsonwebtoken"
import { ErrorCode } from "../schema/errors/ErrorCode"
import { zInsufficientPermissionsError } from "../schema/errors/InsufficientPermissionsError"

const error = (): (typeof zInsufficientPermissionsError)["_input"] => ({
    minted: new Date(),
    success: false,
    code: ErrorCode.InsufficientPermissionsError,
    error: {
        message: "Forbidden"
    }
})

export const adminProtected: RequestHandler = (req, res, next) => {
    const authHeader = req.headers["authorization"]
    const [format, token] = authHeader ? authHeader.split(" ") : ["", ""]

    if (format !== "Bearer") {
        res.status(403).json(error())
        return
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err, _) => {
        if (err) {
            res.status(403).json(error())
        }

        next()
    })
}
