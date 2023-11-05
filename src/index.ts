import dotenv from "dotenv"
import express from "express"
import cluster from "cluster"
import { cpus } from "os"
import { activitiesRouter } from "./routes/activities"
import { manifestRouter } from "./routes/manifest"
import { activityRouter } from "./routes/activity"
import { leaderboardRouter } from "./routes/leaderboard"
import { playerRouter } from "./routes/player"
import { searchRouter } from "./routes/search"
import { pgcrRouter } from "./routes/pgcr"
import { failure } from "./util"

const port = Number(process.env.PORT || 8000)
const totalCPUs = cpus().length
const urlOriginRegex = /^https:\/\/(?:[a-zA-Z0-9-]+\.)?raidhub\.app$/

if (process.env.PROD && !process.env.PRIVATE_KEY) {
    console.error("Missing private API KEY")
    process.exit(1)
}

if (cluster.isPrimary) {
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
    const app = express()

    // allow our private API
    app.use((req, res, next) => {
        if (req.headers.origin && urlOriginRegex.test(req.headers.origin)) {
            res.header("Access-Control-Allow-Origin", req.headers.origin)
            next()
        } else if (
            "x-api-key" in req.headers &&
            req.headers["x-api-key"] === process.env.PRIVATE_KEY
        ) {
            if (req.headers.origin) {
                res.header("Access-Control-Allow-Origin", req.headers.origin)
            } else {
                res.header("Access-Control-Allow-Origin", "*")
            }
            next()
        } else {
            res.header("Access-Control-Allow-Origin", "https://raidhub.app")
            res.status(403).send(
                failure({}, "Request originated from an invalid origin")
            )
        }
    })

    app.use("/activities", activitiesRouter)
    app.use("/activity", activityRouter)
    app.use("/manifest", manifestRouter)
    app.use("/leaderboard", leaderboardRouter)
    app.use("/player", playerRouter)
    app.use("/search", searchRouter)
    app.use("/pgcr", pgcrRouter)

    app.listen(port, () => {
        console.log("Express server started on port: " + port)
    })
}
