import express from "express"
import { activitiesRouter } from "./routes/activities"
import { manifestRouter } from "./routes/manifest"

const port = Number(process.env.PORT || 8000)

const app = express()

app.use("/activities", activitiesRouter)
app.use("/manifest", manifestRouter)

app.listen(port, () => {
    console.log("Express server started on port: " + port)
})
