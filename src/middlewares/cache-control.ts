import { RequestHandler } from "express"

export const cacheControl =
    (seconds: number): RequestHandler =>
    (req, res, next) => {
        res.setHeader("Cache-Control", `max-age=${seconds}`)
        next()
    }
