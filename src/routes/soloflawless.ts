import { Request, Response, Router } from "express"
import { failure, success } from "~/util"
import { prisma } from "~/prisma"

export const sfRouter = Router()

sfRouter.get("/", async (req: Request, res: Response) => {
    try {
        const found = await prisma.activity.findFirst({
            where: {
                playerCount: 1,
                flawless: true,
                raidHash: 3881495763
            },
            include: {
                playerActivity: {
                    include: {
                        player: true
                    }
                }
            }
        })
        if (found) {
            const player = found.playerActivity[0].player
            const data = {
                dateStarted: found.dateStarted,
                dateCompleted: found.dateCompleted,
                instanceId: String(found.instanceId),
                kills: found.playerActivity[0].kills,
                deaths: found.playerActivity[0].deaths,
                assists: found.playerActivity[0].assists,
                timePlayedSeconds: found.playerActivity[0].timePlayedSeconds,
                player: { ...player, membershipId: String(player.membershipId) }
            }
            res.status(200).json(data)
        } else {
            res.status(200).json({ player: null })
        }
    } catch (e) {
        console.error(e)
        res.status(500).json(failure(e, "Failed"))
    }
})
