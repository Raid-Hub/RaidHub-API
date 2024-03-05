import { RequestHandler } from "express"
import jwt from "jsonwebtoken"
import { zInsufficientPermissionsError } from "../RaidHubErrors"
import { ErrorCode } from "../schema/common"

export const adminProtected: RequestHandler = (req, res, next) => {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    jwt.verify(token!, process.env.JWT_SECRET!, (err, _) => {
        if (err) {
            res.status(403).json({
                message: "Forbidden",
                minted: new Date(),
                success: false,
                error: {
                    message: "Forbidden",
                    type: ErrorCode.InsufficientPermissionsError
                }
            } satisfies (typeof zInsufficientPermissionsError)["_input"])
        }

        next()
    })
}
