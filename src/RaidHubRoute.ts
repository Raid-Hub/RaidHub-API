/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestHandler, Router } from "express"
import { ZodDiscriminatedUnion, ZodObject, ZodType, ZodTypeAny, ZodUnknown } from "zod"
import { zBodyValidationError, zPathValidationError, zQueryValidationError } from "./RaidHubErrors"
import { IRaidHubRoute, RaidHubHandler } from "./RaidHubRouterTypes"
import { z } from "./schema/zod"

// This class is used to define type-safe a route in the RaidHub API
export class RaidHubRoute<
    M extends "get" | "post",
    ResponseBody extends ZodType,
    ErrorResponseBody extends z.ZodObject<{
        type: z.ZodLiteral<string>
    }>,
    Params extends ZodObject<
        any,
        any,
        any,
        { [x: string]: any },
        { [x: string]: any }
    > = ZodObject<any>,
    Query extends
        | ZodObject<any, any, any, { [x: string]: any }, { [x: string]: any }>
        | ZodDiscriminatedUnion<any, any> = ZodObject<any>,
    Body extends ZodType = ZodUnknown
> implements IRaidHubRoute
{
    private readonly router: Router
    readonly method: M
    readonly description?: string
    readonly summary?: string
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
        ResponseBody["_input"],
        ErrorResponseBody["_input"]
    >
    readonly responseSchema: ResponseBody
    readonly errorSchema: ErrorResponseBody | null
    readonly errorCodes: {
        success: 200 | 201 | 207
        error: 400 | 401 | 403 | 404 | 503
    }

    // Construct a new route for the API and attach it into a router with myRoute.express
    constructor(args: {
        method: M
        descritiption?: string
        summary?: string
        params?: Params
        query?: Query
        body?: Body
        middlewares?: RequestHandler<z.infer<Params>, any, z.infer<Body>, z.infer<Query>>[]
        handler: RaidHubHandler<
            Params,
            Query,
            Body,
            ResponseBody["_input"],
            ErrorResponseBody["_input"]
        >
        response: {
            success: {
                statusCode: 200 | 201 | 207
                schema: ResponseBody
            }
            error?: {
                statusCode: 400 | 401 | 403 | 404 | 503
                schema: ErrorResponseBody
            }
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
        this.responseSchema = args.response.success.schema
        this.errorSchema = args.response.error?.schema ?? null
        this.errorCodes = {
            success: args.response.success.statusCode,
            error: args.response.error?.statusCode ?? 400
        }
    }

    private validateParams: RequestHandler<z.infer<Params>, any, z.infer<Body>, z.infer<Query>> = (
        req,
        res,
        next
    ) => {
        if (!this.paramsSchema) {
            req.params = {}
            return next()
        }
        const parsed = this.paramsSchema.safeParse(req.params)
        if (parsed.success) {
            req.params = parsed.data
            next()
        } else {
            const result: (typeof zPathValidationError)["_input"] = {
                minted: new Date(),
                success: false,
                message: "Invalid path params",
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
        if (!this.querySchema) {
            req.query = {}
            return next()
        }
        const parsed = this.querySchema.safeParse(req.query)
        if (parsed.success) {
            req.query = parsed.data
            next()
        } else {
            const result: (typeof zQueryValidationError)["_input"] = {
                minted: new Date(),
                success: false,
                message: "Invalid query params",
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
            const result: (typeof zBodyValidationError)["_input"] = {
                minted: new Date(),
                success: false,
                message: "Invalid JSON body",
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
                const minted = new Date()
                const result = await this.handler(req)
                if (result.success) {
                    res.status(this.errorCodes.success).json({
                        minted,
                        success: true,
                        response: result.response,
                        message: result.message
                    })
                } else {
                    res.status(this.errorCodes.error).json({
                        minted,
                        success: false,
                        response: result.error,
                        message: result.message
                    })
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

        return this.method === "get"
            ? this.router.get("/", ...args)
            : this.router.post("/", ...args)
    }

    // Used for testing to mcok a request by passing the data directly to the handler
    async mock(req: { params?: unknown; query?: unknown; body?: unknown }) {
        const res = await this.handler({
            params: this.paramsSchema?.parse(req.params) ?? {},
            query: this.querySchema?.parse(req.query) ?? {},
            body: this.bodySchema?.parse(req.body) ?? {}
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

    openApiRoutes() {
        const allResponses = [
            [this.errorCodes.success, "Success", this.responseSchema],
            this.errorSchema ? [this.errorCodes.error, "Error", this.errorSchema] : null,
            this.paramsSchema ? [404, "Not found", zPathValidationError] : null,
            this.querySchema ? [400, "Bad request", zQueryValidationError] : null,
            this.bodySchema ? [400, "Bad request", zBodyValidationError] : null
        ].filter(Boolean) as [number, string, ZodObject<any>][]

        const byCode: { [statusCode: string]: ZodType<unknown>[] } = {}
        allResponses.forEach(([code, _, schema]) => {
            if (!byCode[code]) {
                byCode[code] = [schema]
            } else {
                byCode[code] = [...byCode[code], schema]
            }
        })

        return [
            {
                path: "",
                method: this.method,
                description: this.description,
                summary: this.summary,
                request: {
                    params: this.paramsSchema ?? undefined,
                    query: (this.querySchema as ZodObject<any>) ?? undefined,
                    body: this.bodySchema
                        ? {
                              content: {
                                  "application/json": {
                                      schema: this.bodySchema
                                  }
                              }
                          }
                        : undefined
                },
                responses: Object.fromEntries(
                    Object.entries(byCode).map(([code, schemas]) => [
                        code,
                        {
                            description: allResponses.findLast(([c]) => c === Number(code))![1],
                            content: {
                                "application/json": {
                                    schema:
                                        schemas.length > 1
                                            ? z.union(
                                                  schemas as [
                                                      ZodTypeAny,
                                                      ZodTypeAny,
                                                      ...ZodTypeAny[]
                                                  ]
                                              )
                                            : schemas[0]
                                }
                            }
                        }
                    ])
                )
            }
        ]
    }
}
