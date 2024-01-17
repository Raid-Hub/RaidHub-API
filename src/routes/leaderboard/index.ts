import { Router } from "express"
import { leaderboardGlobalRoute } from "./global"
import { leaderboardRaidWorldfirstRoute } from "./worldfirst"
import { leaderboardRaidIndividualRoute } from "./individual"
import { leaderboardSpeedrunRoute } from "./speedrun"

export const leaderboardRouter = Router()
leaderboardRouter.use("/global/:category", leaderboardGlobalRoute.express)

const raidRouter = Router({ mergeParams: true })
leaderboardRouter.use("/:raid", raidRouter)
raidRouter.use("/worldfirst/:category", leaderboardRaidWorldfirstRoute.express)
raidRouter.use("/individual/:category", leaderboardRaidIndividualRoute.express)
raidRouter.use("/speedrun", leaderboardSpeedrunRoute.express)
