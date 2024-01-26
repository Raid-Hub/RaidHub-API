import { RequestHandler, Router } from "express"
import { ZodObject, ZodType, ZodUnknown, z } from "zod"

export type RaidHubResponse<T, E> = {
    minted: Date
    message?: string
} & ({ success: true; response: T } | { success: false; error: E; statusCode: number })

export type RaidHubHandler<
    Params extends ZodType,
    Query extends ZodType,
    Body extends ZodType,
    T,
    E
> = (req: {
    params: z.infer<Params>
    query: z.infer<Query>
    body: z.infer<Body>
}) => Promise<RaidHubResponse<T, E>>

// This class is used to define type-safe a route in the RaidHub API
export class RaidHubRoute<
    M extends "get" | "post",
    ResponseBody extends ZodType,
    ErrorResponseBody extends ZodObject<any> = ZodObject<any>,
    Params extends ZodType = ZodUnknown,
    Query extends ZodType = ZodUnknown,
    Body extends ZodType = ZodUnknown
> {
    private readonly router: Router
    readonly method: M
    readonly paramsSchema: Params | null
    readonly querySchema: Query | null
    readonly bodySchema: Body | null
    private readonly middlewares: RequestHandler<
        z.infer<Params>,
        any,
        z.infer<Body>,
        z.infer<Query>
    >[]
    private readonly handler: RaidHubHandler<
        Params,
        Query,
        Body,
        z.infer<ResponseBody>,
        z.infer<ErrorResponseBody>
    >
    readonly responseSchema: ResponseBody
    readonly errorSchema: ErrorResponseBody | null

    // Construct a new route for the API and attach it into a router with myRoute.express
    constructor(args: {
        method: M
        params?: Params
        query?: Query
        body?: Body
        middlewares?: RequestHandler<z.infer<Params>, any, z.infer<Body>, z.infer<Query>>[]
        handler: RaidHubHandler<
            Params,
            Query,
            Body,
            z.infer<ResponseBody>,
            z.infer<ErrorResponseBody>
        >
        response: {
            success: ResponseBody
            error?: ErrorResponseBody
        }
    }) {
        this.router = Router({
            strict: true,
            mergeParams: true
        })
        this.method = args.method
        this.paramsSchema = args.params ?? null
        this.querySchema = args.query ?? null
        this.bodySchema = args.body ?? null
        this.middlewares = args.middlewares ?? []
        this.handler = args.handler
        this.responseSchema = args.response.success
        this.errorSchema = args.response.error ?? null
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
            const result: z.infer<typeof validationError> = {
                minted: new Date(),
                success: false,
                message: "Invalid path params",
                statusCode: 404,
                error: {
                    issues: parsed.error.issues
                }
            }
            res.status(404).json(result)
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
            const result: z.infer<typeof validationError> = {
                minted: new Date(),
                success: false,
                message: "Invalid query params",
                statusCode: 400,
                error: {
                    issues: parsed.error.issues
                }
            }
            res.status(400).json(result)
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
            const result: z.infer<typeof validationError> = {
                minted: new Date(),
                success: false,
                message: "Invalid JSON body",
                statusCode: 400,
                error: {
                    issues: parsed.error.issues
                }
            }
            res.status(400).json(result)
        }
    }

    // This is the actual controller that is passed to express as a handler
    private controller: RequestHandler<z.infer<Params>, any, z.infer<Body>, z.infer<Query>> =
        async (req, res, next) => {
            try {
                const result = await this.handler(req)
                if (result.success) {
                    res.status(this.method === "get" ? 200 : 201).json(result)
                } else {
                    res.status(result.statusCode).json(result)
                }
            } catch (e) {
                next(e)
            }
        }

    // This is the express router that is returnedand used to create the actual express route
    get express() {
        const args = [
            ...this.middlewares,
            this.validateParams,
            this.validateQuery,
            this.validateBody,
            this.controller
        ] as const

        switch (this.method) {
            case "get":
                return this.router.get("/", ...args)
            case "post":
                return this.router.post("/", ...args)
            default:
                throw new Error("Invalid method")
        }
    }

    // Used for testing to mcok a request by passing the data directly to the handler
    async mock(req: { params?: unknown; query?: unknown; body?: unknown }) {
        const res = await this.handler({
            params: this.paramsSchema?.parse(req.params) ?? req.params,
            query: this.querySchema?.parse(req.query) ?? req.query,
            body: this.bodySchema?.parse(req.body) ?? req.body
        })

        // We essentially can use this type to narrow down the type of res in our unit tests
        // This will guarantee that we are testing the correct type of response and that
        // also the shape matches the schema
        if (res.success) {
            return {
                type: "ok",
                parsed: this.responseSchema.parse(res.response)
            } as const
        } else {
            return {
                type: "err",
                parsed: this.errorSchema?.strict().parse(res.error)
            } as const
        }
    }
}

export function ok<T>(response: T, message?: string) {
    return {
        minted: new Date(),
        message,
        response,
        success: true
    } satisfies RaidHubResponse<T, any>
}

export function fail<E>(error: E, code: number, message?: string) {
    return {
        minted: new Date(),
        message,
        error,
        statusCode: code,
        success: false
    } satisfies RaidHubResponse<any, E>
}

/**
 * The below errors are various errors that middleware can throw
 */
//

export const validationError = z.object({
    minted: z.date(),
    message: z.union([
        z.literal("Invalid path params"),
        z.literal("Invalid query params"),
        z.literal("Invalid JSON body")
    ]),
    success: z.literal(false),
    statusCode: z.union([z.literal(400), z.literal(404)]),
    error: z.any()
})

export const serverError = z.object({
    message: z.literal("Something went wrong."),
    minted: z.date(),
    success: z.literal(false),
    statusCode: z.literal(500),
    error: z.any()
})

export const adminProtectedError = z.object({
    message: z.literal("Forbidden"),
    minted: z.date(),
    success: z.literal(false),
    statusCode: z.literal(403),
    error: z.object({
        type: z.literal("forbidden")
    })
})

export const corsError = z.object({
    message: z.union([z.literal("Invalid API Key"), z.literal("Missing API Key")]),
    minted: z.date(),
    success: z.literal(false),
    statusCode: z.literal(401),
    error: z.object({
        type: z.literal("cors"),
        apiKey: z.string().nullable(),
        origin: z.string().nullable()
    })
})
