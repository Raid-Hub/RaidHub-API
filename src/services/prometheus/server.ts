import { prometheusRegistry } from "./registry"

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
