import compression from "compression"
import dotenv from "dotenv"
import express from "express"
import path from "path"
import { cors, options } from "./middlewares/cors"
import { errorHandler } from "./middlewares/errorHandler"
import { router } from "./routes"

dotenv.config()

// @ts-expect-error this is a hack to make BigInts work with JSON.stringify
BigInt.prototype.toJSON = function () {
    return this.toString()
}

const port = Number(process.env.PORT || 8000)

if (process.env.PROD && !process.env.PRIVATE_KEY_PROD) {
    console.error("Missing private API KEY")
    process.exit(1)
}

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
app.options("*", options)

// Apply CORS
app.use(cors)

// parse incoming request body with json, apply the router, handle any uncaught errors
app.use(express.json(), compression(), router.express, errorHandler)

// Start the server
app.listen(port, () => {
    console.log("Express server started on port: " + port)
})
