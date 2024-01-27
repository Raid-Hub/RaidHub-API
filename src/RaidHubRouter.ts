import { RouteConfig } from "@asteasolutions/zod-to-openapi"
import { RequestHandler, Router } from "express"
import { IRaidHubRoute } from "./RaidHubRouterTypes"

export type RaidHubPath = {
    path: string
    route: IRaidHubRoute
}

export class RaidHubRouter implements IRaidHubRoute {
    readonly routes: RaidHubPath[]
    readonly middlewares: RequestHandler[]
    constructor(args: { middlewares?: RequestHandler[]; routes: RaidHubPath[] }) {
        this.middlewares = args.middlewares ?? []
        this.routes = args.routes
    }

    get express() {
        const router = Router({ strict: true, mergeParams: true })
        this.middlewares.forEach(middleware => {
            router.use(middleware)
        })
        this.routes.forEach(({ path, route }) => {
            router.use(path, route.express)
        })
        return router
    }

    openApiRoutes(): RouteConfig[] {
        return this.routes.flatMap(({ path, route }) => {
            const parentPath = path.replace(/\/:(\w+)/, "/{$1}")
            return route.openApiRoutes().map(childRoute => ({
                ...childRoute,
                path: parentPath + childRoute.path
            }))
        })
    }
}
