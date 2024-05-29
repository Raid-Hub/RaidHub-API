import { Histogram } from "prom-client"

export const httpRequestTimer = new Histogram({
    name: "incoming_api_request_duration_ms",
    help: "Duration of HTTP requests in ms",
    labelNames: ["path", "status_code"],
    // buckets for response time from 0.1ms to 10s
    buckets: [0.1, 1, 5, 15, 50, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000]
})
