import { RequestHandler } from "express"

export const adminProtected =
    (prod: boolean): RequestHandler =>
    (req, res, next) => {
        if (
            !prod || // dev mode
            ("x-admin-key" in req.headers && req.headers["x-admin-key"] === process.env.ADMIN_KEY)
        ) {
            next()
        } else {
            res.status(403).send("Forbidden")
        }
    }
