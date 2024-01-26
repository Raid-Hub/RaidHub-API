import { RequestHandler } from "express"
import { corsError } from "../RaidHubRoute"
import { includedIn } from "../util/helpers"
import { z } from "zod"

const isValidOrigin = (origin: string) => /^https:\/\/(?:[a-zA-Z0-9-]+\.)?raidhub\.io$/.test(origin)

export const options: RequestHandler = (req, res, _) => {
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    res.header("Access-Control-Allow-Origin", (req.headers.origin || "*").toString())
    res.header("Access-Control-Allow-Headers", "*")
    res.sendStatus(204)
}

export const cors: RequestHandler = (req, res, next) => {
    res.set("Access-Control-Allow-Origin", (req.headers.origin || "*").toString())
    if (!process.env.PROD) {
        next()
    } else if (
        req.headers.origin &&
        isValidOrigin(req.headers.origin) // matches raidhub url
    ) {
        next()
    } else if (
        "x-api-key" in req.headers &&
        includedIn(
            [process.env.PRIVATE_KEY_PREVIEW, process.env.PRIVATE_KEY_PROD],
            req.headers["x-api-key"]
        )
        // api key required
    ) {
        next()
    } else {
        res.status(401).send({
            message: req.headers["x-api-key"] ? "Invalid API Key" : "Missing API Key",
            minted: new Date(),
            success: false,
            statusCode: 401,
            error: {
                type: "cors",
                origin: req.headers.origin || null,
                apiKey: req.headers["x-api-key"]?.toString() || null
            }
        } satisfies z.infer<typeof corsError>)
    }
}
