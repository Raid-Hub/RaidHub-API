import { Router } from "express"
import { adminRouter } from "./admin"
import { manifestRoute } from "./manifest"
import { playerRouter } from "./player"
import { pgcrRoute } from "./pgcr"
import { activityRouter } from "./activity"
import { leaderboardRouter } from "./leaderboard"

export const router = Router({ strict: true, mergeParams: true })

router.use("/activity", activityRouter)
router.use("/admin", adminRouter)
router.use("/leaderboard", leaderboardRouter)
router.use("/player", playerRouter)
router.use("/manifest", manifestRoute.express)
router.use("/pgcr", pgcrRoute.express)
