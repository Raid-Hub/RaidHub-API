import { Router } from "express"
import { adminProtected } from "~/middlewares/admin-protect"
import { adminQueryRoute } from "./query"

export const adminRouter = Router({
    strict: true
})

adminRouter.use(adminProtected(Boolean(process.env.PROD)))
adminRouter.use(adminQueryRoute.express)
