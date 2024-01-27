import { RaidHubRouter } from "../../RaidHubRouter"
import { activityRootRoute } from "./activity"
import { activitySearchRoute } from "./search"

export const activityRouter = new RaidHubRouter({
    routes: [
        {
            path: "/search",
            route: activitySearchRoute
        },
        {
            path: "/:instanceId",
            route: activityRootRoute
        }
    ]
})
