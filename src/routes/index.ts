import { RaidHubRouter } from "../RaidHubRouter"
import { activityRouter } from "./activity"
import { adminRouter } from "./admin"
import { leaderboardRouter } from "./leaderboard"
import { manifestRoute } from "./manifest"
import { pgcrRoute } from "./pgcr"
import { playerRouter } from "./player"

export const router = new RaidHubRouter({
    middlewares: [],
    routes: [
        {
            path: "/activity",
            route: activityRouter
        },
        {
            path: "/admin",
            route: adminRouter
        },
        {
            path: "/leaderboard",
            route: leaderboardRouter
        },
        {
            path: "/manifest",
            route: manifestRoute
        },
        {
            path: "/pgcr/:instanceId",
            route: pgcrRoute
        },
        {
            path: "/player",
            route: playerRouter
        }
    ]
})
