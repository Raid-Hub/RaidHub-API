import { RequestHandler } from "express"

export const cacheControl =
    (seconds: number): RequestHandler =>
    (req, res, next) => {
        res.once("finish", () => {
            if (res.statusCode === 200) {
                res.setHeader("Cache-Control", `max-age=${seconds}`)
            }
        })

        next()
    }
