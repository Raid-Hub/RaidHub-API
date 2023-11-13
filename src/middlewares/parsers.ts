import { RequestHandler } from "express"
import { ZodType, z } from "zod"
import { failure } from "~/util"

export const zodBodyParser =
    <Z extends ZodType>(schema: Z): RequestHandler<unknown, any, z.infer<Z>> =>
    (req, res, next) => {
        const parsed = schema.safeParse(req.body)
        if (parsed.success) {
            req.body = parsed.data
            next()
        } else {
            res.status(400).json(failure({ issues: parsed.error.issues }, "Invalid JSON body"))
        }
    }

export const zodQueryParser =
    <Z extends ZodType>(schema: Z): RequestHandler<unknown, any, any, z.infer<Z>> =>
    (req, res, next) => {
        const parsed = schema.safeParse(req.query)
        if (parsed.success) {
            req.query = parsed.data
            next()
        } else {
            res.status(400).json(failure({ issues: parsed.error.issues }, "Invalid query params"))
        }
    }

export const zodParamsParser =
    <Z extends ZodType>(schema: Z): RequestHandler<z.infer<Z>> =>
    (req, res, next) => {
        const parsed = schema.safeParse(req.params)
        if (parsed.success) {
            req.params = parsed.data
            next()
        } else {
            res.status(400).json(failure({ issues: parsed.error.issues }, "Invalid path"))
        }
    }
