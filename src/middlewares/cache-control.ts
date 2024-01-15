import { RequestHandler } from "express"

export function cacheControl<P, S, B, Q, L extends Record<string, any>>(
    seconds: number
): RequestHandler<P, S, B, Q, L> {
    return (req, res, next) => {
        // save the previous send method
        const _send = res.send.bind(res)

        // override the json method to cache with 200's
        res.send = body => {
            if (res.statusCode === 200) {
                res.setHeader("Cache-Control", `max-age=${seconds}`)
            }
            return _send(body)
        }

        next()
    }
}
