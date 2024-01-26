import { RouteConfig } from "@asteasolutions/zod-to-openapi"
import { Router } from "express"
import { ZodType } from "zod"
import { z } from "./util/zod"

export interface IRaidHubRoute {
    express: Router
    openApiRoutes(): RouteConfig[]
}

export type RaidHubResponse<T, E> = {
    minted: Date
    message?: string
} & ({ success: true; response: T } | { success: false; error: E })

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
