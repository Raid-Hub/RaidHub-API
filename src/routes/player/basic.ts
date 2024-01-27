import { RaidHubRoute } from "../../RaidHubRoute"
import { cacheControl } from "../../middlewares/cache-control"
import { zPlayerInfo } from "../../schema/common"
import { z, zBigIntString } from "../../schema/zod"
import { prisma } from "../../services/prisma"
import { fail, ok } from "../../util/response"
import { playerRouterParams } from "./_schema"

export const playerBasicRoute = new RaidHubRoute({
    method: "get",
    params: playerRouterParams,
    middlewares: [cacheControl(60)],
    async handler(req) {
        const member = await prisma.player.findUnique({
            where: {
                membershipId: req.params.membershipId
            },
            select: {
                membershipId: true,
                membershipType: true,
                iconPath: true,
                displayName: true,
                bungieGlobalDisplayName: true,
                bungieGlobalDisplayNameCode: true,
                lastSeen: true
            }
        })

        if (!member) {
            return fail(
                { notFound: true, membershipId: req.params.membershipId },
                "Player not found"
            )
        } else {
            return ok(member)
        }
    },
    response: {
        success: zPlayerInfo,
        error: z.object({
            notFound: z.literal(true),
            membershipId: zBigIntString()
        })
    }
})
