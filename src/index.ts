import compression from "compression"
import express from "express"
import path from "path"
import { servePrometheus } from "./metrics"
import { verifyApiKey } from "./middlewares/apiKeys"
import { errorHandler } from "./middlewares/errorHandler"
import { router } from "./routes"

// @ts-expect-error this is a hack to make BigInts work with JSON.stringify
BigInt.prototype.toJSON = function () {
    return this.toString()
}

const port = Number(process.env.PORT || 8000)

const app = express()

if (!process.env.PROD) {
    // serve static files for development
    const staticRouter = express.Router()
    app.use("/static", staticRouter)
    staticRouter.use("/docs", express.static(path.join(__dirname, "..", "open-api", "index.html")))
    staticRouter.use(
        "/openapi",
        express.static(path.join(__dirname, "..", "open-api", "openapi.json"))
    )
    staticRouter.use(
        "/coverage",
        express.static(path.join(__dirname, "..", "coverage", "index.html"))
    )
}

app.use("*", (_, res, next) => {
    res.header("X-Processed-By", String(process.pid))
    next()
})

// handle OPTIONS pre-flight requests before any other middleware
app.options("*", (req, res, _) => {
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    res.header("Access-Control-Allow-Origin", (req.headers.origin || "*").toString())
    res.header("Access-Control-Allow-Headers", "*")
    res.sendStatus(204)
})

// parse incoming request body with json, apply the router, handle any uncaught errors
app.use(verifyApiKey, express.json(), compression(), router.express, errorHandler)

// Start the server
app.listen(port, () => {
    console.log("Express server started on port: " + port)
})

servePrometheus()
