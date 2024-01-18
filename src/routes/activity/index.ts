import { Router } from "express"
import { activityRootRoute } from "./activity"
import { activitySearchRoute } from "./search"

export const activityRouter = Router({
    strict: true
})

activityRouter.use("/search", activitySearchRoute.express)
activityRouter.use("/:instanceId", activityRootRoute.express)
