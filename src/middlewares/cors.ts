import { RequestHandler } from "express"
import { failure } from "~/util"

const urlOriginRegex = /^https:\/\/(?:[a-zA-Z0-9-]+\.)?raidhub\.app$/

export const cors =
    (prod: boolean): RequestHandler =>
    (req, res, next) => {
        if (
            !prod || // dev mode
            (req.headers.origin && urlOriginRegex.test(req.headers.origin)) || // matches raidhub url
            ("x-api-key" in req.headers && req.headers["x-api-key"] === process.env.PRIVATE_KEY) // api key required
        ) {
            if (req.headers.origin) {
                res.header("Access-Control-Allow-Origin", req.headers.origin)
            } else {
                res.header("Access-Control-Allow-Origin", "*")
            }
            next()
        } else {
            res.header("Access-Control-Allow-Origin", "https://raidhub.app")
            res.status(403).send(failure({}, "Request originated from an invalid origin"))
        }
    }
