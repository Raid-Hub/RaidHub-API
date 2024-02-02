import { RaidHubRouter } from "../../RaidHubRouter"
import { leaderboardGlobalRoute } from "./global"
import { leaderboardRaidIndividualRoute } from "./individual"
import { leaderboardSearchRoute } from "./search"
import { leaderboardSpeedrunRoute } from "./speedrun"
import { leaderboardRaidWorldfirstRoute } from "./worldfirst"

export const leaderboardRouter = new RaidHubRouter({
    routes: [
        { path: "/search", route: leaderboardSearchRoute },
        {
            path: "/global/:category",
            route: leaderboardGlobalRoute
        },
        {
            path: "/:raid",
            route: new RaidHubRouter({
                routes: [
                    {
                        path: "/worldfirst/:category",
                        route: leaderboardRaidWorldfirstRoute
                    },
                    {
                        path: "/individual/:category",
                        route: leaderboardRaidIndividualRoute
                    },
                    {
                        path: "/speedrun",
                        route: leaderboardSpeedrunRoute
                    }
                ]
            })
        }
    ]
})
