import dotenv from "dotenv"
import express from "express"
import { cors } from "./middlewares/cors"
import { errorHandler } from "./middlewares/errorHandler"
import { router } from "./routes"

dotenv.config()

const port = Number(process.env.PORT || 8000)

if (process.env.PROD && !process.env.PRIVATE_KEY_PROD) {
    console.error("Missing private API KEY")
    process.exit(1)
}

const app = express()

app.use("*", (_, res, next) => {
    res.header("X-Processed-By", String(process.pid))
    next()
})

// handle OPTIONS before any other middleware
app.options("*", (req, res, _) => {
    const method = req.headers["access-control-request-method"]
    const allowedHeaders = ["X-API-KEY"]
    if (method == "POST") {
        allowedHeaders.push("Content-Type")
    }
    res.header("Access-Control-Allow-Methods", method)
    res.header("Access-Control-Allow-Origin", req.headers.origin)
    res.header("Access-Control-Allow-Headers", allowedHeaders.join(", "))
    res.sendStatus(200)
})

// Apply CORS if Prod
app.use(cors(Boolean(process.env.PROD)))

// parse incoming request body with json
app.use(express.json())

// @ts-expect-error this is a hack to make BigInts work with JSON.stringify
BigInt.prototype["toJSON"] = function () {
    return this.toString()
}

app.use(router)

// handle any uncaught errors
app.use(errorHandler)

// Start the server
app.listen(port, () => {
    console.log("Express server started on port: " + port)
})
