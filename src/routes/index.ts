import { RaidHubRouter } from "../RaidHubRouter"
import { activityRouter } from "./activity"
import { adminRouter } from "./admin"
import { authorizationRoute } from "./authorize"
import { leaderboardRouter } from "./leaderboard"
import { manifestRoute } from "./manifest"
import { pgcrRoute } from "./pgcr"
import { playerRouter } from "./player"

export const router = new RaidHubRouter({
    routes: [
        {
            path: "/manifest",
            route: manifestRoute
        },
        {
            path: "/player",
            route: playerRouter
        },
        {
            path: "/activity",
            route: activityRouter
        },
        {
            path: "/leaderboard",
            route: leaderboardRouter
        },
        {
            path: "/pgcr/:instanceId",
            route: pgcrRoute
        },
        {
            path: "/admin",
            route: adminRouter
        },
        {
            path: "/authorize",
            route: authorizationRoute
        }
    ]
})
