import { RequestHandler } from "express"
import { corsError } from "../RaidHubRoute"
import { includedIn } from "../util/helpers"
import { z } from "zod"

const urlOriginRegex = /^https:\/\/(?:[a-zA-Z0-9-]+\.)?raidhub\.app$/

export const cors =
    (prod: boolean): RequestHandler =>
    (req, res, next) => {
        if (
            req.headers.origin &&
            urlOriginRegex.test(req.headers.origin) // matches raidhub url
        ) {
            res.header("Access-Control-Allow-Origin", "*")
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
            res.header("Access-Control-Allow-Origin", "*")
            next()
        } else {
            res.header("Access-Control-Allow-Origin", "https://raidhub.io")
            res.status(req.headers["x-api-key"] ? 403 : 401).send({
                message: "Request originated from an invalid origin",
                minted: new Date(),
                success: false,
                statusCode: req.headers["x-api-key"] ? 403 : 401,
                error: {
                    apiKeyFound: !!req.headers["x-api-key"],
                    cors: true
                }
            } satisfies z.infer<typeof corsError>)
        }
    }
