import dotenv from "dotenv"
import express from "express"
import path from "path"
import { cacheControl } from "./middlewares/cache-control"
import { cors, options } from "./middlewares/cors"
import { errorHandler } from "./middlewares/errorHandler"
import { router } from "./routes"

dotenv.config()

// @ts-expect-error this is a hack to make BigInts work with JSON.stringify
BigInt.prototype["toJSON"] = function () {
    return this.toString()
}

const port = Number(process.env.PORT || 8000)

if (process.env.PROD && !process.env.PRIVATE_KEY_PROD) {
    console.error("Missing private API KEY")
    process.exit(1)
}

const app = express()

// serve the open-api docs at /docs
app.use("/docs", cacheControl(15), express.static(path.join(__dirname, "../open-api/docs.html")))

app.use("*", (_, res, next) => {
    res.header("X-Processed-By", String(process.pid))
    next()
})

// handle OPTIONS pre-flight requests before any other middleware
app.options("*", options)

// Apply CORS
app.use(cors)

// parse incoming request body with json
app.use(express.json())

// apply the router
app.use(router.express)

// handle any uncaught errors
app.use(errorHandler)

// Start the server
app.listen(port, () => {
    console.log("Express server started on port: " + port)
})
