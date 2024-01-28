import { RequestHandler } from "express"
import jwt from "jsonwebtoken"
import { zInsufficientPermissionsError } from "../RaidHubErrors"

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
                    type: "InsufficientPermissionsError"
                }
            } satisfies (typeof zInsufficientPermissionsError)["_input"])
        }

        next()
    })
}
