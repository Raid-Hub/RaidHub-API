import { RouteConfig } from "@asteasolutions/zod-to-openapi"
import { Router } from "express"
import { ZodType } from "zod"
import { z } from "./schema/zod"

export interface IRaidHubRoute {
    express: Router
    openApiRoutes(): RouteConfig[]
}

export type RaidHubResponse<T, E> = {
    minted: Date
    message?: string
} & ({ success: true; response: T } | { success: false; error: E })

export type RaidHubHandlerReturn<T, E, C> =
    | { success: true; response: T; message?: string }
    | { success: false; error: E; type: C; message?: string }

export type RaidHubHandler<
    Params extends ZodType,
    Query extends ZodType,
    Body extends ZodType,
    T,
    E,
    C extends string
> = (req: {
    params: z.infer<Params>
    query: z.infer<Query>
    body: z.infer<Body>
}) => Promise<RaidHubHandlerReturn<T, E, C>>
