import { Router } from "express"
import { bigIntString, failure, success } from "~/util"
import { prisma } from "~/prisma"
import { z } from "zod"
import { zodParamsParser } from "~/middlewares/parsers"
import { cacheControl } from "~/middlewares/cache-control"

export const memberRouter = Router()

memberRouter.use(cacheControl(60))

const PlayerParamSchema = z.object({
    membershipId: bigIntString
})

memberRouter.get("/:membershipId", zodParamsParser(PlayerParamSchema), async (req, res, next) => {
    try {
        const member = await getMember({ membershipId: req.params.membershipId })
        if (!member) {
            res.status(404).json(failure({}, "Player not found"))
        } else {
            res.status(200).json(success(member))
        }
    } catch (e) {
        console.error(e)
        next(e)
    }
})

async function getMember({ membershipId }: { membershipId: bigint }) {
    const member = await prisma.player.findUnique({
        where: {
            membershipId
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
    return member ? { ...member, membershipId: String(member.membershipId) } : null
}
