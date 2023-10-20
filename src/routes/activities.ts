import express, { Request, Response } from "express"
import { failure, success } from "../util"
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

    try {
        const data = await getPlayerActivities({ membershipId, page, count })
        res.status(200).json(success(data))
    } catch (e) {
        res.status(500).json(failure(e, "Internal server error"))
    }
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
    const activities = await prisma.activity.findMany({
        where: {
            playerActivities: {
                some: {
                    membershipId: membershipId
                }
            }
        },
        take: count + 1,
        skip: (page - 1) * count,
        orderBy: {
            dateCompleted: "desc"
        },
        include: {
            playerActivities: {
                select: {
                    finishedRaid: true,
                    player: {
                        select: {
                            membershipId: true
                        }
                    }
                }
            }
        }
    })

    return {
        hasMore: !!activities[count],
        activities: Object.fromEntries(
            activities.slice(0, count).map(({ playerActivities, ...activity }) => [
                activity.activityId,
                {
                    ...activity,
                    players: Object.fromEntries(
                        playerActivities.map(ap => [ap.player.membershipId, ap.finishedRaid])
                    )
                }
            ])
        )
    }
}
