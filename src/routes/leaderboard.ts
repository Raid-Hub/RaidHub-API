import { Router } from "express"
import { worldfirstRouter } from "./worldfirst"
import { individualRouter } from "./individual"
import { globalRouter } from "./global"

export const leaderboardRouter = Router()

const raidRouter = Router({ mergeParams: true })
leaderboardRouter.use("/:raid", raidRouter)
raidRouter.use("/worldfirst", worldfirstRouter)
raidRouter.use("/individual", individualRouter)

leaderboardRouter.use("/global", globalRouter)
