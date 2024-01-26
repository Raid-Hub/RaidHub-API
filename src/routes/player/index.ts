import { RaidHubRouter } from "../../RaidHubRouter"
import { playerActivitiesRoute } from "./activities"
import { playerBasicRoute } from "./basic"
import { playerProfileRoute } from "./profile"
import { playerSearchRoute } from "./search"

export const playerRouter = new RaidHubRouter({
    routes: [
        { path: "/search", route: playerSearchRoute },
        {
            path: "/:membershipId",
            route: new RaidHubRouter({
                routes: [
                    {
                        path: "/activities",
                        route: playerActivitiesRoute
                    },
                    {
                        path: "/basic",
                        route: playerBasicRoute
                    },
                    {
                        path: "/profile",
                        route: playerProfileRoute
                    }
                ]
            })
        }
    ]
})
