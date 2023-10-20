import express from "express"
import { activitiesRouter } from "./routes/activities"
import {pgcrRouter} from "./routes/pgcr";

const port = Number(process.env.PORT || 8000)

const app = express()

app.use("/activities", activitiesRouter)
app.use("/pgcr", pgcrRouter)

app.listen(port, () => {
    console.log("Express server started on port: " + port)
})
