import { failure, success } from "util/helpers"
import { prisma } from "~/prisma"
import { cacheControl } from "~/middlewares/cache-control"
import { RaidHubRoute } from "route"
import { playerRouterParams } from "."

export const playerBasicRoute = new RaidHubRoute({
    method: "get",
    params: playerRouterParams,
    middlewares: [cacheControl(60)],
    async handler(req, res, next) {
        try {
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
                res.status(404).json(failure({}, "Player not found"))
            } else {
                res.status(200).json(success(member))
            }
        } catch (e) {
            next(e)
        }
    }
})
