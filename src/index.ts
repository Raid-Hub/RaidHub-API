import dotenv from "dotenv"
import express, { json } from "express"
import cluster from "cluster"
import { cpus } from "os"
import { activitiesRouter } from "./routes/activities"
import { manifestRouter } from "./routes/manifest"
import { activityRouter } from "./routes/activity"
import { leaderboardRouter } from "./routes/leaderboard"
import { playerRouter } from "./routes/player"
import { searchRouter } from "./routes/search"
import { pgcrRouter } from "./routes/pgcr"
import { cors } from "./middlewares/cors"
import { errorHandler } from "./middlewares/errorHandler"

const port = Number(process.env.PORT || 8000)
const totalCPUs = cpus().length

if (process.env.PROD && !process.env.PRIVATE_KEY) {
    console.error("Missing private API KEY")
    process.exit(1)
}

if (!process.env.PROD) {
    go()
} else if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`)
    dotenv.config()

    console.log(`Found ${totalCPUs} CPUs`)
    for (let i = 0; i < totalCPUs; i++) {
        cluster.fork()
    }

    cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`)
        if (signal) {
            console.log(`Worker was killed by signal: ${signal}`)
        }
        if (code !== 0) {
            console.log(`Worker exited with error code: ${code}`)
            cluster.fork()
        }
    })
} else {
    console.log(`Worker ${process.pid} started`)
    go(process.pid)
}

function go(pid?: number) {
    const app = express()

    if (pid) {
        app.use("*", (_, res, next) => {
            res.header("X-Processed-By", String(pid))
            next()
        })
    }

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
    app.use(json())

    // Define our routes
    app.use("/activities", activitiesRouter)
    app.use("/activity", activityRouter)
    app.use("/manifest", manifestRouter)
    app.use("/leaderboard", leaderboardRouter)
    app.use("/player", playerRouter)
    app.use("/search", searchRouter)
    app.use("/pgcr", pgcrRouter)

    // handle any uncaught errors
    app.use(errorHandler)

    // Start the server
    app.listen(port, () => {
        console.log("Express server started on port: " + port)
    })
}
