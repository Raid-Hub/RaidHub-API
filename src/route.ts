import { RequestHandler, Router } from "express"
import { ZodType, ZodUnknown, z } from "zod"
import { failure } from "./util/helpers"

export class RaidHubRoute<
    M extends "get" | "post",
    Params extends ZodType = ZodUnknown,
    Query extends ZodType = ZodUnknown,
    Body extends ZodType = ZodUnknown
> {
    private readonly router: Router
    private readonly path?: string
    private readonly method: M
    private readonly paramsSchema: Params | null
    private readonly querySchema: Query | null
    private readonly bodySchema: Body | null
    private readonly middlewares: RequestHandler<
        z.infer<Params>,
        any,
        z.infer<Body>,
        z.infer<Query>
    >[]
    private readonly handler: RequestHandler<z.infer<Params>, any, z.infer<Body>, z.infer<Query>>

    constructor(args: {
        path?: string
        method: M
        params?: Params
        query?: Query
        body?: Body
        middlewares?: RequestHandler<z.infer<Params>, any, z.infer<Body>, z.infer<Query>>[]
        handler: RequestHandler<z.infer<Params>, any, z.infer<Body>, z.infer<Query>>
    }) {
        this.router = Router({
            strict: true,
            mergeParams: true
        })
        this.path = args.path
        this.method = args.method
        this.paramsSchema = args.params ?? null
        this.querySchema = args.query ?? null
        this.bodySchema = args.body ?? null
        this.middlewares = args.middlewares ?? []
        this.handler = args.handler
    }

    private validateParams: RequestHandler<z.infer<Params>, any, z.infer<Body>, z.infer<Query>> = (
        req,
        res,
        next
    ) => {
        if (!this.paramsSchema) return next()

        const parsed = this.paramsSchema.safeParse(req.params)
        if (parsed.success) {
            req.params = parsed.data
            next()
        } else {
            res.status(404).json(failure({ issues: parsed.error.issues }, "Invalid path"))
        }
    }

    private validateQuery: RequestHandler<z.infer<Params>, any, z.infer<Body>, z.infer<Query>> = (
        req,
        res,
        next
    ) => {
        if (!this.querySchema) return next()
        const parsed = this.querySchema.safeParse(req.query)
        if (parsed.success) {
            req.query = parsed.data
            next()
        } else {
            res.status(400).json(failure({ issues: parsed.error.issues }, "Invalid query params"))
        }
    }

    private validateBody: RequestHandler<z.infer<Params>, any, z.infer<Body>, z.infer<Query>> = (
        req,
        res,
        next
    ) => {
        if (!this.bodySchema) return next()
        const parsed = this.bodySchema.safeParse(req.body)
        if (parsed.success) {
            req.body = parsed.data
            next()
        } else {
            res.status(400).json(failure({ issues: parsed.error.issues }, "Invalid JSON body"))
        }
    }

    get express() {
        const args = [
            this.path ?? "/",
            ...this.middlewares,
            this.validateParams,
            this.validateQuery,
            this.validateBody,
            this.handler
        ] as const

        switch (this.method) {
            case "get":
                return this.router.get(...args)
            case "post":
                return this.router.post(...args)
            default:
                throw new Error("Invalid method")
        }
    }
}
