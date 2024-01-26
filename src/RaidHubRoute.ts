import { RequestHandler, Router } from "express"
import { ZodDiscriminatedUnion, ZodObject, ZodType, ZodUnknown } from "zod"
import { validationError } from "./RaidHubErrors"
import { IRaidHubRoute, RaidHubHandler } from "./RaidHubRouterTypes"
import { z } from "./util/zod"

// This class is used to define type-safe a route in the RaidHub API
export class RaidHubRoute<
    M extends "get" | "post",
    ResponseBody extends ZodType,
    ErrorResponseBody extends ZodObject<any> = ZodObject<any>,
    Params extends ZodObject<
        any,
        any,
        any,
        { [x: string]: any },
        { [x: string]: any }
    > = ZodObject<{}>,
    Query extends
        | ZodObject<any, any, any, { [x: string]: any }, { [x: string]: any }>
        | ZodDiscriminatedUnion<any, any> = ZodObject<{}>,
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
        if (!this.paramsSchema) {
            req.params = {}
            return next()
        }
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
        if (!this.querySchema) {
            req.query = {}
            return next()
        }
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
                    res.status(404).json(result)
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
            params: this.paramsSchema?.parse(req.params) ?? {},
            query: this.querySchema?.parse(req.query) ?? {},
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

    openApiRoutes() {
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
                responses: {
                    ...(this.responseSchema
                        ? {
                              [this.method === "get" ? 200 : 201]: {
                                  description: "Success",
                                  content: {
                                      "application/json": {
                                          schema: this.responseSchema
                                      }
                                  }
                              }
                          }
                        : {}),
                    ...(this.errorSchema
                        ? {
                              [404]: {
                                  description: "Not found",
                                  content: {
                                      "application/json": {
                                          schema: this.errorSchema
                                      }
                                  }
                              }
                          }
                        : {})
                }
            }
        ]
    }
}
