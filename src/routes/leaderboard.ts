import { Router } from "express"
import { worldfirstRouter } from "./worldfirst"
import { individualRouter } from "./individual"

export const leaderboardRouter = Router()
const raidRouter = Router({ mergeParams: true })

leaderboardRouter.use("/:raid", raidRouter)

raidRouter.use("/worldfirst", worldfirstRouter)
raidRouter.use("/individual", individualRouter)
