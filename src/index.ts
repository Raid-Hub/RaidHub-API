import express from "express"
import { activitiesRouter } from "./routes/activities"
import { pgcrRouter } from "./routes/pgcr"
import { manifestRouter } from "./routes/manifest"
import cors from "cors"
import { activityRouter } from "./routes/activity"

const port = Number(process.env.PORT || 8000)

const app = express()
const allowedOrigins = ["http://localhost", "https://127.0.0.1", "https://*.raidhub.app"]
app.use(
    cors({
        origin: allowedOrigins
    })
)

app.use("/activities", activitiesRouter)
app.use("/pgcr", pgcrRouter)
app.use("/activity", activityRouter)
app.use("/manifest", manifestRouter)

app.listen(port, () => {
    console.log("Express server started on port: " + port)
})
