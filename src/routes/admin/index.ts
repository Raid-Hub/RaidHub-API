import { Router } from "express"
import { adminQueryRoute } from "./query"
import { adminProtected } from "../../middlewares/admin-protect"

export const adminRouter = Router({
    strict: true
})

adminRouter.use(adminProtected)
adminRouter.use("/query", adminQueryRoute.express)
