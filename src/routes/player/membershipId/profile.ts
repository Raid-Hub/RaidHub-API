import { z } from "zod"
import { RaidHubRoute } from "../../../RaidHubRoute"
import { getProfile } from "../../../data-access-layer/player"
import { cacheControl } from "../../../middlewares/cache-control"
import { processPlayerAsync } from "../../../middlewares/processPlayerAsync"
import { zPlayerProfile } from "../../../schema/components/PlayerProfile"
import { ErrorCode } from "../../../schema/errors/ErrorCode"
import { zBigIntString } from "../../../schema/util"

export const playerProfileRoute = new RaidHubRoute({
    method: "get",
    description: `Get a player's profile information. This includes global stats, activity stats, and world first entries. 
This is used to hydrate the RaidHub profile page`,
    params: z.object({
        membershipId: zBigIntString()
    }),
    response: {
        success: {
            statusCode: 200,
            schema: zPlayerProfile
        },
        errors: [
            {
                statusCode: 404,
                code: ErrorCode.PlayerNotFoundError,
                schema: z.object({
                    membershipId: zBigIntString()
                })
            }
        ]
    },
    middleware: [cacheControl(30), processPlayerAsync],
    async handler(req) {
        const data = await getProfile(req.params.membershipId)
        if (!data) {
            return RaidHubRoute.fail(ErrorCode.PlayerNotFoundError, {
                membershipId: req.params.membershipId
            })
        } else {
            return RaidHubRoute.ok(data)
        }
    }
})
