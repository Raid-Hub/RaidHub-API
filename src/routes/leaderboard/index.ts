import { Router } from "express"
import { leaderboardGlobalRoute } from "./global"
import { leaderboardRaidWorldfirstRoute } from "./worldfirst"
import { leaderboardRaidIndividualRoute } from "./individual"

export const leaderboardRouter = Router()
leaderboardRouter.use("/global", leaderboardGlobalRoute.express)

const raidRouter = Router({ mergeParams: true })
leaderboardRouter.use("/:raid", raidRouter)
raidRouter.use("/worldfirst/:category", leaderboardRaidWorldfirstRoute.express)
raidRouter.use("/individual/:category", leaderboardRaidIndividualRoute.express)
