import { RaidHubRoute } from "../../RaidHubRoute"
import { cacheControl } from "../../middlewares/cache-control"
import { prisma } from "../../services/prisma"
import { fail, ok } from "../../util/response"
import { z, zBigIntString } from "../../util/zod"
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
