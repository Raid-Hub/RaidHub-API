import dotenv from "dotenv"
import express from "express"
import { activitiesRouter } from "./routes/activities"
import { manifestRouter } from "./routes/manifest"
import cors from "cors"
import { activityRouter } from "./routes/activity"
import { leaderboardRouter } from "./routes/leaderboard"
import { playerRouter } from "./routes/player"
import { searchRouter } from "./routes/search"

dotenv.config()

const port = Number(process.env.PORT || 8000)

const app = express()
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://127.0.0.1:3000",
    "https://127.0.0.1:3001",
    "https://raidhub.app",
    "https://staging.raidhub.app"
]
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
app.listen(port, () => {
    console.log("Express server started on port: " + port)
})
