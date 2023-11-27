import { RequestHandler } from "express"
import { failure, includedIn } from "~/util"

const urlOriginRegex = /^https:\/\/(?:[a-zA-Z0-9-]+\.)?raidhub\.app$/

export const cors =
    (prod: boolean): RequestHandler =>
    (req, res, next) => {
        if (
            req.headers.origin &&
            urlOriginRegex.test(req.headers.origin) // matches raidhub url
        ) {
            res.header("Access-Control-Allow-Origin", req.headers.origin)
            console.log("a")
            next()
        } else if (
            !prod || // dev mode
            ("x-api-key" in req.headers &&
                includedIn(
                    [process.env.PRIVATE_KEY_PREVIEW, process.env.PRIVATE_KEY_PROD],
                    req.headers["x-api-key"]
                ))
            // api key required
        ) {
            if (req.headers.origin) {
                res.header("Access-Control-Allow-Origin", req.headers.origin)
            } else {
                res.header("Access-Control-Allow-Origin", "*")
            }
            console.log("b")
            next()
        } else {
            console.log("c")
            res.header("Access-Control-Allow-Origin", "https://raidhub.app")
            res.status(403).send(failure({}, "Request originated from an invalid origin"))
        }
    }
