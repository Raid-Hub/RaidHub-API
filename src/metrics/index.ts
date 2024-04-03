import { Registry } from "prom-client"

const prometheusRegistry = new Registry()

export const servePrometheus = () => {
    Bun.serve({
        port: 8082,
        async fetch(req) {
            const url = new URL(req.url)
            if (url.pathname === "/metrics")
                return new Response(await prometheusRegistry.metrics(), {
                    headers: {
                        "Content-Type": prometheusRegistry.contentType
                    }
                })
            return new Response("404!")
        }
    })

    console.log("Metrics server started on port: 8082")
}
