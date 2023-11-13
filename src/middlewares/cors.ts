import { RequestHandler } from "express"
import { failure } from "~/util"

const urlOriginRegex = /^https:\/\/(?:[a-zA-Z0-9-]+\.)?raidhub\.app$/

export const cors =
    (prod: boolean): RequestHandler =>
    (req, res, next) => {
        if (!prod || (req.headers.origin && urlOriginRegex.test(req.headers.origin))) {
            res.header("Access-Control-Allow-Origin", req.headers.origin)
            next()
        } else if (
            "x-api-key" in req.headers &&
            req.headers["x-api-key"] === process.env.PRIVATE_KEY
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
