import { RequestHandler } from "express"
import { Histogram } from "prom-client"
import { RaidHubRoute } from "../../RaidHubRoute"

const httpRequestTimer = new Histogram({
    name: "incoming_api_request_duration_ms",
    help: "Duration of HTTP requests in ms",
    labelNames: ["path", "status_code"],
    // buckets for response time from 0.1ms to 1s
    buckets: [0.1, 1, 5, 15, 50, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000]
})

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
