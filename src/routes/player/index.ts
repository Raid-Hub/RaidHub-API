import { Router } from "express"
import { playerBasicRoute } from "./basic"
import { playerActivitiesRoute } from "./activities"
import { playerProfileRoute } from "./profile"
import { playerSearchRoute } from "./search"

export const playerRouter = Router({
    strict: true
})

const membershipIdRouter = Router({ mergeParams: true, strict: true })
playerRouter.use("/:membershipId", membershipIdRouter)
membershipIdRouter.use("/activities", playerActivitiesRoute.express)
membershipIdRouter.use("/basic", playerBasicRoute.express)
membershipIdRouter.use("/profile", playerProfileRoute.express)

playerRouter.use("/search", playerSearchRoute.express)
