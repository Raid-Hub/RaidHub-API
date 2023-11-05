import dotenv from "dotenv"
import express from "express"
import cluster from "cluster"
import cors from "cors"
import { cpus } from "os"
import { activitiesRouter } from "./routes/activities"
import { manifestRouter } from "./routes/manifest"
import { activityRouter } from "./routes/activity"
import { leaderboardRouter } from "./routes/leaderboard"
import { playerRouter } from "./routes/player"
import { searchRouter } from "./routes/search"
import { pgcrRouter } from "./routes/pgcr"

const port = Number(process.env.PORT || 8000)
const totalCPUs = cpus().length
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://127.0.0.1:3000",
    "https://127.0.0.1:3001",
    "https://raidhub.app",
    "https://staging.raidhub.app"
]

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

    app.use(
        cors({
            origin: allowedOrigins
        })
    )

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
