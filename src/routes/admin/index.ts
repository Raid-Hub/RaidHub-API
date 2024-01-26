import { RaidHubRouter } from "../../RaidHubRouter"
import { adminProtected } from "../../middlewares/admin-protect"
import { adminQueryRoute } from "./query"

export const adminRouter = new RaidHubRouter({
    middlewares: [adminProtected],
    routes: [
        {
            path: "/query",
            route: adminQueryRoute
        }
    ]
})
