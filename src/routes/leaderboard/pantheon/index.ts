import { BungieMembershipType } from "bungie-net-core/models"
import { RaidHubRouter } from "../../../RaidHubRouter"
import { pantheonAllRoute } from "./all"
import { pantheonFirstRoute } from "./first"
import { pantheonScoreRoute } from "./score"
import { pantheonSpeedrunRoute } from "./speedrun"

export type PantheonLeaderboardEntry = {
    position: number
    rank: number
    value: number
    activity: {
        instanceId: string
        hash: string
        completed: boolean
        fresh: boolean
        flawless: boolean
        playerCount: number
        dateStarted: Date
        dateCompleted: Date
        duration: number
        platformType: BungieMembershipType
        score: number
    }
    players: {
        player: {
            membershipId: string
            membershipType: BungieMembershipType | null
            iconPath: string | null
            displayName: string | null
            bungieGlobalDisplayName: string | null
            bungieGlobalDisplayNameCode: string | null
            lastSeen: Date
        }
        data: {
            completed: boolean
            sherpas: number
            isFirstClear: boolean
            timePlayedSeconds: number
        }
    }[]
}

export const pantheonRouter = new RaidHubRouter({
    routes: [
        {
            path: "/:version/first",
            route: pantheonFirstRoute
        },
        {
            path: "/:version/score",
            route: pantheonScoreRoute
        },
        {
            path: "/:version/speedrun",
            route: pantheonSpeedrunRoute
        },
        {
            path: "/all/:category",
            route: pantheonAllRoute
        }
    ]
})
