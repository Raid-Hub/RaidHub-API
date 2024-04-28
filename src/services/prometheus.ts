import { Histogram, Registry } from "prom-client"

export const prometheusRegistry = new Registry()

export const httpRequestTimer = new Histogram({
    name: "incoming_api_request_duration_ms",
    help: "Duration of HTTP requests in ms",
    labelNames: ["path", "status_code"],
    // buckets for response time from 0.1ms to 1s
    buckets: [0.1, 1, 5, 15, 50, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000]
})
prometheusRegistry.registerMetric(httpRequestTimer)

const port = process.env.METRICS_PORT || 8082
export const servePrometheus = () => {
    Bun.serve({
        port: port,
        async fetch(req) {
            const url = new URL(req.url)
            if (url.pathname === "/metrics") {
                const body = await prometheusRegistry.metrics()
                return new Response(body, {
                    headers: {
                        "Content-Type": prometheusRegistry.contentType
                    }
                })
            }
            return new Response(undefined, {
                status: 404
            })
        }
    })

    console.log(`Metrics server started on port: ${port}`)
}
