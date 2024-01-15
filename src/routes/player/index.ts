import { Router } from "express"
import { z } from "zod"
import { zBigIntString } from "util/zod-common"
import { playerBasicRoute } from "./basic"
import { playerActivitiesRoute } from "./activities"
import { playerProfileRoute } from "./profile"
import { playerSearchRoute } from "./search"

export const playerRouter = Router({
    strict: true
})
    .use(
        "/:membershipId",
        Router({ mergeParams: true, strict: true })
            .use("/activities", playerActivitiesRoute.express)
            .use("/basic", playerBasicRoute.express)
            .use("/profile", playerProfileRoute.express)
    )
    .use("/search", playerSearchRoute.express)

export const playerRouterParams = z.object({
    membershipId: zBigIntString()
})
