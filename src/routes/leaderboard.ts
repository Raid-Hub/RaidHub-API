import { Router } from "express"
import { worldfirstRouter } from "./worldfirst"

export const leaderboardRouter = Router()
const raidRouter = Router({ mergeParams: true })

leaderboardRouter.use("/:raid", raidRouter)

raidRouter.use("/worldfirst", worldfirstRouter)
