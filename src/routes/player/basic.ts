import { RaidHubRoute, fail, ok } from "../../RaidHubRoute"
import { playerRouterParams } from "./_schema"
import { z } from "zod"
import { cacheControl } from "../../middlewares/cache-control"
import { prisma } from "../../prisma"
import { zBigIntString } from "../../util/zod-common"

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
                404,
                "Player not found"
            )
        } else {
            return ok(member)
        }
    },
    response: {
        success: z
            .object({
                membershipId: zBigIntString(),
                membershipType: z.number().nullable(),
                iconPath: z.string().nullable(),
                displayName: z.string().nullable(),
                bungieGlobalDisplayName: z.string().nullable(),
                bungieGlobalDisplayNameCode: z.string().nullable(),
                lastSeen: z.date().nullable()
            })
            .strict(),
        error: z.object({
            notFound: z.boolean(),
            membershipId: zBigIntString()
        })
    }
})
