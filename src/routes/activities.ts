import express, { Request, Response } from "express"
import { failure, success } from "../util"
import { prisma } from "../database"
import { NextFunction } from "connect"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"

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

    try {
        const data = await getPlayerActivities({ membershipId, cursor })
        res.status(200).json(success(data))
    } catch (e) {
        res.status(500).json(failure(e, "Internal server error"))
    }
})

const COUNT = 250

async function getPlayerActivities({
    membershipId,
    cursor
}: {
    membershipId: string
    cursor: string | null
}) {
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
                      take: COUNT + 1,
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
                      take: COUNT + 1,
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
            : await getFirstPageOfActivities(membershipId)
    )

    return {
        prevActivity: cursor
            ? activities[COUNT]?.activityId ?? null
            : activities[activities.length - 1]?.activityId ?? null,
        activities: activities.slice(0, COUNT).map((a, i) => ({
            ...a,
            didMemberComplete: playerActivities[i].finishedRaid
        }))
    }
}

/* This allows us to fetch the same set of activities for the first request each day, making caching just a bit better. We
    can cache subsequent pages, while leaving the first one open */
async function getFirstPageOfActivities(membershipId: string) {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const getActivites = (cutoff: Date) =>
        Promise.all([
            prisma.activity.findMany({
                where: {
                    playerActivities: {
                        some: {
                            membershipId: membershipId
                        }
                    },
                    dateCompleted: {
                        gte: cutoff,
                        lte: today
                    }
                },
                take: COUNT + 1,
                orderBy: {
                    dateCompleted: "desc"
                }
            }),
            prisma.playerActivities.findMany({
                where: {
                    membershipId: membershipId,
                    activity: {
                        dateCompleted: {
                            gte: cutoff,
                            lte: today
                        }
                    }
                },
                take: COUNT + 1,
                select: {
                    finishedRaid: true
                },
                orderBy: {
                    activity: {
                        dateCompleted: "desc"
                    }
                }
            })
        ])

    const lastMonth = new Date(today)
    lastMonth.setMonth(today.getUTCMonth() - 1)

    const [activities, playerActivities] = await getActivites(lastMonth)

    if (!activities.length) {
        const lastYear = new Date(today)
        lastYear.setMonth(today.getUTCFullYear() - 1)

        const [lastYearActivities, lastYearPlayerActivities] = await getActivites(lastYear)
        if (!lastYearActivities.length) {
            return getActivites(new Date(0))
        } else {
            return [lastYearActivities, lastYearPlayerActivities] as const
        }
    } else {
        return [activities, playerActivities] as const
    }
}
