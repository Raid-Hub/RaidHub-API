import express, { Request, Response } from "express"
import { success } from "../util"
import { prisma } from "../database"

export const activitiesRouter = express.Router()

activitiesRouter.get("/:destinyMembershipId", async (req: Request, res: Response) => {
    const membershipId = req.params.destinyMembershipId
    let page: number | undefined = Number(req.query.page)
    if (Number.isNaN(page)) {
        page = undefined
    }
    let count: number | undefined = Number(req.query.count)
    if (Number.isNaN(count)) {
        count = undefined
    }

    const data = await getPlayerActivities({ membershipId, page, count })

    return res.status(200).json(success(data))
})

async function getPlayerActivities({
    membershipId,
    page,
    count
}: {
    membershipId: string
    page?: number
    count?: number
}) {
    count = count ?? 250
    page = page ?? 1
    const foundActivities = await prisma.player.findUnique({
        where: { membershipId },
        select: {
            allActivities: {
                take: count + 1,
                skip: (page - 1) * count,
                orderBy: {
                    dateCompleted: "desc"
                },
                where: {
                    flawless: true
                },
                include: {
                    allPlayers: {
                        select: {
                            membershipId: true
                        }
                    },
                    completedPlayers: {
                        select: {
                            membershipId: true
                        }
                    }
                }
            }
        }
    })

    const activities = foundActivities ? foundActivities.allActivities : []

    return {
        hasMore: !!activities[count],
        activities: Object.fromEntries(
            activities.slice(0, count).map(activity => [
                activity.activityId,
                {
                    ...activity,
                    allPlayers: activity.allPlayers.map(p => p.membershipId),
                    completedPlayers: activity.completedPlayers.map(p => p.membershipId)
                }
            ])
        )
    }
}
