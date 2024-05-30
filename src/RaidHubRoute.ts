/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestHandler, Router } from "express"
import { ZodObject, ZodType, ZodTypeAny, ZodUnknown, z } from "zod"
import { RaidHubRouter } from "./RaidHubRouter"
import { IRaidHubRoute, RaidHubHandler, RaidHubHandlerReturn } from "./RaidHubRouterTypes"
import { RaidHubResponse, registerResponse } from "./schema/RaidHubResponse"
import { zApiKeyError } from "./schema/errors/ApiKeyError"
import { zBodyValidationError } from "./schema/errors/BodyValidationError"
import { ErrorCode } from "./schema/errors/ErrorCode"
import { zInsufficientPermissionsError } from "./schema/errors/InsufficientPermissionsError"
import { zPathValidationError } from "./schema/errors/PathValidationError"
import { zQueryValidationError } from "./schema/errors/QueryValidationError"
import { httpRequestTimer } from "./services/prometheus/metrics"

// This class is used to define type-safe a route in the RaidHub API
export class RaidHubRoute<
    M extends "get" | "post",
    ResponseBody extends ZodType,
    ErrorResponseBody extends readonly z.ZodObject<any>[],
    Params extends ZodObject<
        any,
        any,
        any,
        { [x: string]: any },
        { [x: string]: any }
    > = ZodObject<any>,
    Query extends ZodObject<
        any,
        any,
        any,
        { [x: string]: any },
        { [x: string]: any }
    > = ZodObject<any>,
    Body extends ZodType = ZodUnknown,
    ErrorType extends ErrorCode = never
> implements IRaidHubRoute
{
    readonly method: M
    readonly description: string
    readonly paramsSchema: Params | null
    readonly querySchema: Query | null
    readonly bodySchema: Body | null
    readonly responseSchema: ResponseBody
    readonly errors: [
        400 | 401 | 403 | 404 | 501 | 503,
        type: ErrorType,
        schema: ErrorResponseBody[number]
    ][]
    readonly successCode: 200 | 201 | 207
    private parent: RaidHubRouter | null = null
    private readonly isAdministratorRoute: boolean = false
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
        ErrorResponseBody[number]["_input"],
        ErrorType
    >
    private readonly router: Router

    // Construct a new route for the API and attach it into a router with myRoute.express
    constructor(args: {
        method: M
        description: string
        params?: Params
        query?: Query
        body?: Body
        isAdministratorRoute?: boolean
        middleware?: RequestHandler<z.infer<Params>, any, z.infer<Body>, z.infer<Query>>[]
        handler: RaidHubHandler<
            Params,
            Query,
            Body,
            ResponseBody["_input"],
            NoInfer<ErrorResponseBody[number]["_input"]>,
            NoInfer<ErrorType>
        >
        response: {
            success: {
                statusCode: 200 | 201 | 207
                schema: ResponseBody
            }
            errors?: {
                statusCode: 400 | 401 | 403 | 404 | 501 | 503
                code: ErrorType
                schema: ErrorResponseBody[number]
            }[]
        }
    }) {
        this.router = Router({
            strict: true,
            mergeParams: true
        })
        this.method = args.method
        this.description = args.description
        this.paramsSchema = args.params ?? null
        this.querySchema = args.query ?? null
        this.bodySchema = args.body ?? null
        this.isAdministratorRoute = args.isAdministratorRoute ?? false
        this.middlewares = args.middleware ?? []
        this.handler = args.handler
        this.responseSchema = args.response.success.schema
        this.errors = args.response.errors?.map(e => [e.statusCode, e.code, e.schema]) ?? []
        this.successCode = args.response.success.statusCode
    }

    static ok<T>(response: T): RaidHubHandlerReturn<T, never, never> {
        return {
            response,
            success: true
        }
    }

    static fail<E, C extends ErrorCode>(code: C, error: E): RaidHubHandlerReturn<never, E, C> {
        return {
            error,
            success: false,
            code
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
                errorCode: ErrorCode.PathValidationError,
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
                errorCode: ErrorCode.QueryValidationError,
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
                errorCode: ErrorCode.BodyValidationError,
                error: {
                    issues: parsed.error.issues
                }
            }
            res.status(400).json(result)
        }
    }

    // This is the express router that is returned and used to create the actual express route
    get express() {
        const args = [
            this.measureDuration,
            this.validateParams,
            this.validateQuery,
            this.validateBody,
            ...this.middlewares,
            this.controller
        ] as const

        return this.method === "get"
            ? this.router.get("/", ...args)
            : this.router.post("/", ...args)
    }

    // This is the actual controller that is passed to express as a handler
    private controller: RequestHandler<z.infer<Params>, any, z.infer<Body>, z.infer<Query>> =
        async (req, res, next) => {
            try {
                const result = await this.handler(req)
                const response = this.buildResponse(result)
                if (result.success) {
                    res.status(this.successCode).json(response)
                } else {
                    res.status(this.errors.find(([_, type]) => type === result.code)![0]).json(
                        response
                    )
                }
            } catch (e) {
                next(e)
            }
        }

    private buildResponse(
        result: RaidHubHandlerReturn<
            ResponseBody["_input"],
            ErrorResponseBody[number]["_input"],
            ErrorType
        >
    ): RaidHubResponse<ResponseBody["_input"], ErrorResponseBody[number]["_input"], ErrorType> {
        const minted = new Date()
        if (result.success) {
            return {
                minted,
                success: true,
                response: result.response
            } as const
        } else {
            return {
                minted,
                success: false,
                code: result.code,
                error: result.error
            } as const
        }
    }

    private measureDuration: RequestHandler<z.infer<Params>, any, z.infer<Body>, z.infer<Query>> = (
        _,
        res,
        next
    ) => {
        const start = Date.now()
        res.on("finish", () => {
            const responseTimeInMs = Date.now() - start
            const path = this.getFullPath()
            const code = res.statusCode.toString()
            if (!process.env.PROD && !process.env.TS_JEST) {
                console.log(`Request to ${path} took ${responseTimeInMs}ms`)
            }
            httpRequestTimer.labels(path, code).observe(responseTimeInMs)
        })
        next()
    }

    setParent(parent: RaidHubRouter) {
        this.parent = parent
    }

    getParent(): RaidHubRouter | null {
        return this.parent
    }

    getFullPath(): string {
        return this.parent ? this.parent.getFullPath(this) : "/"
    }

    $generateOpenApiRoutes() {
        const path = this.getFullPath().replace(/\/:(\w+)/g, "/{$1}")

        const allResponses = [
            [
                this.successCode,
                "Success",
                z.object({
                    minted: z.date(),
                    success: z.literal(true),
                    response: registerResponse(path, this.responseSchema)
                })
            ],
            ...this.errors,
            [401, "Unauthorized", zApiKeyError],
            this.isAdministratorRoute ? [403, "Forbidden", zInsufficientPermissionsError] : null,
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

        const security = this.isAdministratorRoute
            ? [
                  {
                      "Administrator Token": []
                  }
              ]
            : undefined

        return [
            {
                path,
                summary: path,
                method: this.method,
                description: this.description,
                security,
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

    /* istanbul ignore next */
    // Used for testing to mock a request by passing the data directly to the handler
    async $mock(req: { params?: unknown; query?: unknown; body?: unknown }) {
        const res = await this.handler({
            params: this.paramsSchema?.parse(req.params) ?? {},
            query: this.querySchema?.parse(req.query) ?? {},
            body: this.bodySchema?.parse(req.body) ?? {}
        }).then(this.buildResponse)

        // We essentially can use this type to narrow down the type of res in our unit tests
        // This will guarantee that we are testing the correct type of response and that
        // also the shape matches the schema
        if (res.success) {
            return {
                type: "ok",
                parsed: this.responseSchema.parse(res.response)
            } as const
        } else {
            const schema =
                this.errors.length === 0
                    ? z.never()
                    : this.errors.length > 1
                      ? z.union(
                            this.errors.map(([, , schema]) => schema) as unknown as readonly [
                                ZodTypeAny,
                                ZodTypeAny,
                                ...ZodTypeAny[]
                            ]
                        )
                      : this.errors[0][2]
            return {
                type: "err",
                parsed: schema.parse(res.error)
            } as const
        }
    }
}
