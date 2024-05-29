import { z } from "zod"
import { RaidHubRoute } from "../../../RaidHubRoute"
import { getRaidId } from "../../../data-access-layer/definitions"
import {
    getContestTeamLeaderboard,
    searchContestTeamLeaderboard
} from "../../../data-access-layer/leaderboard/team/contest"
import { cacheControl } from "../../../middlewares/cache-control"
import { zLeaderboardData } from "../../../schema/components/LeaderboardData"
import { ErrorCode } from "../../../schema/errors/ErrorCode"
import { zLeaderboardPagination } from "../../../schema/query.ts/LeaderboardPagination"
import { zBigIntString } from "../../../schema/util"

export const leaderboardTeamContestRoute = new RaidHubRoute({
    method: "get",
    description: `Ranking of all teams which completed the official contest version of the raid during the contest period.`,
    params: z.object({
        raid: z.string()
    }),
    query: zLeaderboardPagination,
    response: {
        errors: [
            {
                statusCode: 404,
                code: ErrorCode.PlayerNotOnLeaderboardError,
                schema: z.object({
                    membershipId: zBigIntString()
                })
            },
            {
                statusCode: 404,
                code: ErrorCode.RaidNotFoundError,
                schema: z.object({
                    raid: z.string()
                })
            }
        ],
        success: {
            statusCode: 200,
            schema: zLeaderboardData
        }
    },
    middleware: [cacheControl(15)],
    async handler(req) {
        const { raid } = req.params
        const { page, count, search } = req.query

        const definition = await getRaidId(raid)

        if (!definition) {
            return RaidHubRoute.fail(ErrorCode.RaidNotFoundError, {
                raid: raid
            })
        }

        if (search) {
            const entries = await searchContestTeamLeaderboard({
                membershipId: search,
                raidId: definition.id,
                take: count
            })

            if (!entries) {
                return RaidHubRoute.fail(ErrorCode.PlayerNotOnLeaderboardError, {
                    membershipId: search
                })
            }

            return RaidHubRoute.ok({
                type: "team" as const,
                format: "duration" as const,
                entries
            })
        } else {
            const entries = await getContestTeamLeaderboard({
                raidId: definition.id,
                skip: (page - 1) * count,
                take: count
            })

            return RaidHubRoute.ok({
                type: "team" as const,
                format: "duration" as const,
                entries
            })
        }
    }
})
