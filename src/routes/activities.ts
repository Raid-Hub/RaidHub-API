import express, { Request, Response } from "express"
import { failure, success } from "../util"
import { prisma } from "../database"
import { NextFunction } from "connect"

export const activitiesRouter = express.Router()

const cacheCursoredReqsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (req.query.cursor) {
        // Set cache headers to last for 24 hours (in seconds)
        res.setHeader("Cache-Control", "max-age=86400")
    }

    next()
}

activitiesRouter.use(cacheCursoredReqsMiddleware)

activitiesRouter.get("/:destinyMembershipId", async (req: Request, res: Response) => {
    const membershipId = req.params.destinyMembershipId
    const cursor = req.query.cursor ? String(req.query.cursor) : null
    let count: number | undefined = Number(req.query.count)
    if (Number.isNaN(count)) {
        count = undefined
    }
    console.log(cursor)
    try {
        const data = await getPlayerActivities({ membershipId, cursor, count })
        res.status(200).json(success(data))
    } catch (e) {
        res.status(500).json(failure(e, "Internal server error"))
    }
})

async function getPlayerActivities({
    membershipId,
    cursor,
    count
}: {
    membershipId: string
    cursor: string | null
    count?: number
}) {
    count = count ?? 250
    /* This allows us to fetch the same set of activities for the first request each day, making caching just a bit better. We
    can cache subsequent pages, while leaving the first one open */
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const lastMonth = new Date(today)
    lastMonth.setMonth(today.getUTCMonth() - 1)

    const [activities, playerActivities] = await Promise.all(
        // If a cursor is provided
        cursor
            ? [
                  prisma.activity.findMany({
                      where: {
                          playerActivities: {
                              some: {
                                  membershipId: membershipId
                              }
                          }
                      },
                      take: count + 1,
                      cursor: {
                          activityId: cursor
                      },
                      orderBy: {
                          dateCompleted: "desc"
                      }
                  }),
                  prisma.playerActivities.findMany({
                      where: {
                          membershipId: membershipId
                      },
                      take: count + 1,
                      cursor: {
                          activity_player_index: {
                              activityId: cursor,
                              membershipId: membershipId
                          }
                      },
                      select: {
                          finishedRaid: true
                      },
                      orderBy: {
                          activity: {
                              dateCompleted: "desc"
                          }
                      }
                  })
              ]
            : [
                  // If no cursor is provided
                  prisma.activity.findMany({
                      where: {
                          playerActivities: {
                              some: {
                                  membershipId: membershipId
                              }
                          },
                          dateCompleted: {
                              gte: lastMonth,
                              lte: today
                          }
                      },
                      take: count + 1,
                      orderBy: {
                          dateCompleted: "desc"
                      }
                  }),
                  prisma.playerActivities.findMany({
                      where: {
                          membershipId: membershipId,
                          activity: {
                              dateCompleted: {
                                  gte: lastMonth,
                                  lte: today
                              }
                          }
                      },
                      take: count + 1,
                      select: {
                          finishedRaid: true
                      },
                      orderBy: {
                          activity: {
                              dateCompleted: "desc"
                          }
                      }
                  })
              ]
    )

    return {
        prevActivity: cursor
            ? activities[count]?.activityId ?? null
            : activities[activities.length - 1]!.activityId,
        activities: activities.slice(0, count).map((a, i) => ({
            ...a,
            didMemberComplete: playerActivities[i].finishedRaid
        }))
    }
}
