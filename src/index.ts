import express from "express"
import { activitiesRouter } from "./routes/activities"

const port = Number(process.env.PORT || 8000)

const app = express()

app.use("/activities", activitiesRouter)

app.listen(port, () => {
    console.log("Express server started on port: " + port)
})
