import { RequestHandler } from "express"
import fs from "fs"
import path from "path"
import { z } from "zod"
import { zApiKeyError } from "../RaidHubErrors"
import { ErrorCode } from "../schema/common"

const ApiKeys = (() => {
    try {
        const data = fs.readFileSync(path.join(__dirname, "..", "..", "api-keys.json"), "utf-8")
        const entries = z
            .array(
                z.object({
                    contact: z.string().default(""),
                    description: z.string().default(""),
                    origin: z.string().default("*"),
                    key: z.string()
                })
            )
            .parse(JSON.parse(data))
        return Object.fromEntries(entries.map(entry => [entry.key, entry]))
    } catch (e) {
        if (process.env.PROD) {
            console.error("Failed to load API keys", e)
            process.exit(1)
        } else {
            return {}
        }
    }
})()

export const verifyApiKey: RequestHandler = (req, res, next) => {
    if (!process.env.PROD) {
        res.set("Access-Control-Allow-Origin", "*")
        next()
    } else if (isValidAPIKey(req.headers["x-api-key"]?.toString(), req.headers.origin)) {
        res.set("Access-Control-Allow-Origin", (req.headers.origin || "*").toString())
        next()
    } else {
        res.status(401).send({
            message: req.headers["x-api-key"] ? "Invalid API Key" : "Missing API Key",
            minted: new Date(),
            success: false,
            error: {
                type: ErrorCode.ApiKeyError,
                origin: req.headers.origin || null,
                apiKey: req.headers["x-api-key"]?.toString() || null
            }
        } satisfies (typeof zApiKeyError)["_input"])
    }
}

function isValidAPIKey(apiKey: string | undefined, origin: string | undefined): boolean {
    if (!apiKey) return false

    const keyData = ApiKeys.hasOwnProperty(apiKey) ? ApiKeys[apiKey] : null

    if (!keyData) return false
    else if (keyData.origin === "*") return true
    else if (!origin) return false

    try {
        const regex = new RegExp(keyData.origin)
        return regex.test(origin)
    } catch {
        return origin === keyData.origin
    }
}
