import { NextFunction, Request, Response, Router } from "express"
import { failure, success } from "~/util"
import { prisma } from "~/prisma"
import { isContest, isDayOne } from "~/data/raceDates"
import { AllRaidHashes } from "./manifest"

export const activitiesRouter = Router()

activitiesRouter.use((req, res, next) => {
    if (req.query.cursor) {
        // Set cache headers to last for 24 hours (in seconds)
        res.setHeader("Cache-Control", "max-age=86400")
    }

    next()
})

activitiesRouter.get("/:destinyMembershipId", async (req: Request, res: Response) => {
    const membershipId = BigInt(req.params.destinyMembershipId)
    const cursor = req.query.cursor ? BigInt(req.query.cursor as string) : null
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

const activityQuery = (membershipId: bigint) =>
    ({
        where: {
            playerActivity: {
                some: {
                    membershipId: membershipId
                }
            }
        },
        orderBy: {
            dateCompleted: "desc"
        },
        take: COUNT + 1
    }) as const

const playerActivityQuery = (membershipId: bigint) =>
    ({
        where: {
            membershipId: membershipId
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
    }) as const

async function getPlayerActivities({
    membershipId,
    cursor
}: {
    membershipId: bigint
    cursor: bigint | null
}) {
    const [activities, playerActivities] = await Promise.all(
        // If a cursor is provided
        cursor
            ? [
                  prisma.activity.findMany({
                      cursor: {
                          instanceId: cursor
                      },
                      ...activityQuery(membershipId)
                  }),
                  prisma.playerActivity.findMany({
                      ...playerActivityQuery(membershipId),
                      cursor: {
                          instanceId_membershipId: {
                              instanceId: cursor,
                              membershipId: membershipId
                          }
                      }
                  })
              ]
            : await getFirstPageOfActivities(membershipId)
    )

    const prevActivity = cursor
        ? activities[COUNT]?.instanceId ?? null
        : activities[activities.length - 1]?.instanceId ?? null

    return {
        prevActivity: prevActivity ? String(prevActivity) : null,
        activities: activities.slice(0, COUNT).map((a, i) => {
            const { raid } = AllRaidHashes[String(a.raidHash)]
            return {
                ...a,
                instanceId: String(a.instanceId),
                activityId: String(a.instanceId),
                raidHash: String(a.raidHash),
                dayOne: isDayOne(raid, a.dateCompleted),
                contest: isContest(raid, a.dateStarted),
                didMemberComplete: playerActivities[i].finishedRaid
            }
        })
    }
}

/* This allows us to fetch the same set of activities for the first request each day, making caching just a bit better. We
    can cache subsequent pages, while leaving the first one open */
async function getFirstPageOfActivities(membershipId: bigint) {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const { where: where1, ...query1 } = activityQuery(membershipId)
    const { where: where2, ...query2 } = playerActivityQuery(membershipId)

    const getActivites = (cutoff: Date) =>
        Promise.all([
            prisma.activity.findMany({
                ...query1,
                where: {
                    dateCompleted: {
                        gte: cutoff,
                        lte: today
                    },
                    ...where1
                }
            }),
            prisma.playerActivity.findMany({
                where: {
                    ...where2,
                    activity: {
                        dateCompleted: {
                            gte: cutoff,
                            lte: today
                        }
                    }
                },
                ...query2
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
