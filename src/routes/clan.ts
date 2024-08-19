import { z } from "zod"
import { RaidHubRoute } from "../RaidHubRoute"
import { getClanStats } from "../data-access-layer/clan"
import { cacheControl } from "../middlewares/cache-control"
import { zClanLeaderboardEntry } from "../schema/components/Clan"
import { ErrorCode } from "../schema/errors/ErrorCode"
import { zBigIntString } from "../schema/util"

export const clanStatsRoute = new RaidHubRoute({
    method: "get",
    description: "Get the stats for a clan. Data updates weekly.",
    params: z.object({
        groupId: zBigIntString()
    }),
    middleware: [cacheControl(30)],
    response: {
        success: {
            statusCode: 200,
            schema: zClanLeaderboardEntry
        },
        errors: [
            {
                statusCode: 404,
                type: ErrorCode.ClanNotFound,
                schema: z.object({
                    groupId: zBigIntString()
                })
            }
        ]
    },
    async handler({ params }) {
        const groupId = params.groupId

        const stats = await getClanStats(groupId)
        if (!stats) {
            return RaidHubRoute.fail(ErrorCode.ClanNotFound, { groupId })
        }

        return RaidHubRoute.ok(stats)
    }
})
