import { RequestHandler } from "express"
import { ZodType, z } from "zod"
import { failure } from "util/helpers"

export const zodBodyParser =
    <P, Z extends ZodType, ReqQuery>(schema: Z): RequestHandler<P, any, z.infer<Z>, ReqQuery> =>
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
    <P, ReqBody, Z extends ZodType>(schema: Z): RequestHandler<P, any, ReqBody, z.infer<Z>> =>
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
    <Z extends ZodType, ReqBody, ReqQuery>(
        schema: Z
    ): RequestHandler<z.infer<Z>, any, ReqBody, ReqQuery> =>
    (req, res, next) => {
        const parsed = schema.safeParse(req.params)
        if (parsed.success) {
            req.params = parsed.data
            next()
        } else {
            res.status(404).json(failure({ issues: parsed.error.issues }, "Invalid path"))
        }
    }
