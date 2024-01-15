import { Router } from "express"
import { activityRootRoute } from "./activity"
import { activitySearchRoute } from "./search"

export const activityRouter = Router({
    strict: true
})
    .use(activityRootRoute.express)
    .use(activitySearchRoute.express)
