import { RouteConfig } from "@asteasolutions/zod-to-openapi"
import { Router } from "express"
import { IncomingHttpHeaders } from "http"
import { ZodType, z } from "zod"
import { RaidHubRouter } from "./RaidHubRouter"
import { ErrorCode } from "./schema/errors/ErrorCode"

export interface IRaidHubRoute {
    express: Router
    $generateOpenApiRoutes(): RouteConfig[]
    setParent(parent: RaidHubRouter | null): void
    getParent(): RaidHubRouter | null
}

export type RaidHubHandlerReturn<T, E, C extends ErrorCode> =
    | { success: true; response: T }
    | { success: false; error: E; code: C }

export type RaidHubHandler<
    Params extends ZodType,
    Query extends ZodType,
    Body extends ZodType,
    T,
    E,
    C extends ErrorCode
> = (req: {
    params: z.infer<Params>
    query: z.infer<Query>
    body: z.infer<Body>
    headers: IncomingHttpHeaders
}) => Promise<RaidHubHandlerReturn<T, E, C>>
