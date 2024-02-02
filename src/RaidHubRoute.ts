/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestHandler, Router } from "express"
import { ZodObject, ZodType, ZodTypeAny, ZodUnknown } from "zod"
import { zBodyValidationError, zPathValidationError, zQueryValidationError } from "./RaidHubErrors"
import {
    IRaidHubRoute,
    RaidHubHandler,
    RaidHubHandlerReturn,
    RaidHubResponse
} from "./RaidHubRouterTypes"
import { ErrorCode } from "./schema/common"
import { z } from "./schema/zod"

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
        ErrorResponseBody[number]["_input"],
        ErrorType
    >
    readonly responseSchema: ResponseBody
    readonly errors: [
        400 | 401 | 403 | 404 | 503,
        type: ErrorType,
        schema: ErrorResponseBody[number]
    ][]
    readonly successCode: 200 | 201 | 207

    // Construct a new route for the API and attach it into a router with myRoute.express
    constructor(args: {
        method: M
        description?: string
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
            ErrorResponseBody[number]["_input"],
            ErrorType
        >
        response: {
            success: {
                statusCode: 200 | 201 | 207
                schema: ResponseBody
            }
            errors?: {
                statusCode: 400 | 401 | 403 | 404 | 503
                type: ErrorType
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
        this.summary = args.summary
        this.paramsSchema = args.params ?? null
        this.querySchema = args.query ?? null
        this.bodySchema = args.body ?? null
        this.middlewares = args.middlewares ?? []
        this.handler = args.handler
        this.responseSchema = args.response.success.schema
        this.errors = args.response.errors?.map(e => [e.statusCode, e.type, e.schema]) ?? []
        this.successCode = args.response.success.statusCode
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
                    type: ErrorCode.PathValidationError,
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
                    type: ErrorCode.QueryValidationError,
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
                    type: ErrorCode.BodyValidationError,
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
                const response = this.buildResponse(result)
                if (result.success) {
                    res.status(this.successCode).json(response)
                } else {
                    res.status(this.errors.find(([_, type]) => type === result.type)![0]).json(
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
    ): RaidHubResponse<ResponseBody["_input"], ErrorResponseBody[number]["_input"]> {
        const minted = new Date()
        if (result.success) {
            return {
                minted,
                message: result.message,
                success: true,
                response: result.response
            } as const
        } else {
            return {
                minted,
                message: result.message,
                success: false,
                error: {
                    type: result.type,
                    ...result.error
                }
            } as const
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

    openApiRoutes() {
        const allResponses = [
            [this.successCode, "Success", this.responseSchema],
            ...this.errors,
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
                          this.errors.map(([_, type, schema]) =>
                              schema.extend({ type: z.literal(type) })
                          ) as unknown as readonly [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]
                      )
                    : this.errors[0][2].extend({ type: z.literal(this.errors[0][1]) })
            return {
                type: "err",
                parsed: schema.parse(res.error)
            } as const
        }
    }
}
