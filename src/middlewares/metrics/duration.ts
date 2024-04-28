import { RequestHandler } from "express"
import { RaidHubRoute } from "../../RaidHubRoute"
import { httpRequestTimer } from "../../services/prometheus"

export const measureDuration =
    (
        route: // eslint-disable-next-line @typescript-eslint/no-explicit-any
        RaidHubRoute<any, any, any>
    ): RequestHandler =>
    (_, res, next) => {
        const start = Date.now()
        res.on("finish", () => {
            const responseTimeInMs = Date.now() - start
            httpRequestTimer
                .labels(route.getFullPath(), res.statusCode.toString())
                .observe(responseTimeInMs)
        })
        next()
    }
