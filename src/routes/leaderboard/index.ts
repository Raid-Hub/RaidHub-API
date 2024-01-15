import { Router } from "express"
import { leaderboardGlobalRoute } from "./global"
import { leaderboardRaidWorldfirstRoute } from "./worldfirst"
import { leaderboardRaidIndividualRoute } from "./individual"

export const leaderboardRouter = Router()
    .use("/global", leaderboardGlobalRoute.express)
    .use(
        "/:raid",
        Router({ mergeParams: true })
            .use("/worldfirst", leaderboardRaidWorldfirstRoute.express)
            .use("/individual", leaderboardRaidIndividualRoute.express)
    )
