import { success } from "util/helpers"
import { prisma } from "~/prisma"
import { isContest, isDayOne } from "~/data/raceDates"
import { z } from "zod"
import { RaidHubRoute } from "route"
import { playerRouterParams } from "."
import { zBigIntString, zCount } from "util/zod-common"

export const playerActivitiesRoute = new RaidHubRoute({
    method: "get",
    params: playerRouterParams,
    query: z.object({
        count: zCount({
            min: 50,
            def: 2000,
            max: 5000
        }),
        cursor: zBigIntString().optional()
    }),
    async handler(req, res, next) {
        try {
            const { membershipId } = req.params
            const { cursor, count } = req.query
            const data = await getPlayerActivities({
                membershipId,
                cursor,
                count
            })
            // Cache for 1 day if we have a cursor, otherwise 30 seconds
            res.setHeader("Cache-Control", `max-age=${cursor ? 86400 : 30}`)
            res.status(200).json(success(data))
        } catch (e) {
            next(e)
        }
    }
})

const activityQuery = (membershipId: bigint, count: number) =>
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
        include: {
            raidDefinition: {
                select: {
                    raidId: true
                }
            }
        },

        take: count + 1
    }) as const

const playerActivityQuery = (membershipId: bigint, count: number) =>
    ({
        where: {
            membershipId: membershipId
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
    }) as const

async function getPlayerActivities({
    membershipId,
    cursor,
    count
}: {
    membershipId: bigint
    cursor?: bigint
    count: number
}) {
    const [activities, playerActivities] = await Promise.all(
        // If a cursor is provided
        cursor
            ? [
                  prisma.activity.findMany({
                      cursor: {
                          instanceId: cursor
                      },
                      ...activityQuery(membershipId, count)
                  }),
                  prisma.playerActivity.findMany({
                      ...playerActivityQuery(membershipId, count),
                      cursor: {
                          instanceId_membershipId: {
                              instanceId: cursor,
                              membershipId: membershipId
                          }
                      }
                  })
              ]
            : await getFirstPageOfActivities(membershipId, count)
    )

    const countFound = activities.length

    /* either the "bonus" activity we found, or if we did not find a bonus:
    / - if it was cursor based, we've reached the end
    / - if it was not cursor based, aka first req, return 1 less than the current instance
    / - if there were 0 entries, we've reached the end
    */
    const nextCursor =
        countFound === count + 1
            ? activities[countFound - 1].instanceId
            : countFound > 0
            ? cursor
                ? null
                : activities[countFound - 1].instanceId
            : null

    return {
        nextCursor: nextCursor ? String(nextCursor) : null,
        activities: activities.slice(0, count).map((a, i) => {
            return {
                ...a,
                instanceId: String(a.instanceId),
                activityId: String(a.instanceId),
                raidHash: String(a.raidHash),
                dayOne: isDayOne(a.raidDefinition.raidId, a.dateCompleted),
                contest: isContest(a.raidDefinition.raidId, a.dateStarted),
                didMemberComplete: playerActivities[i].finishedRaid
            }
        })
    }
}

/* This allows us to fetch the same set of activities for the first request each day, making caching just a bit better. We
    can cache subsequent pages, while leaving the first one open */
async function getFirstPageOfActivities(membershipId: bigint, count: number) {
    const today = new Date()
    today.setUTCHours(10, 0, 0, 0)

    const { where: where1, ...query1 } = activityQuery(membershipId, count)
    const { where: where2, ...query2 } = playerActivityQuery(membershipId, count)

    const getActivites = (cutoff: Date) =>
        Promise.all([
            prisma.activity.findMany({
                ...query1,
                where: {
                    dateCompleted: {
                        gte: cutoff
                    },
                    ...where1
                },
                include: {
                    raidDefinition: {
                        select: {
                            raidId: true
                        }
                    }
                }
            }),
            prisma.playerActivity.findMany({
                where: {
                    ...where2,
                    activity: {
                        dateCompleted: {
                            gte: cutoff
                        }
                    }
                },
                ...query2
            })
        ])

    const lastMonth = new Date(today)
    lastMonth.setMonth(today.getUTCMonth() - 1)

    const [activities, playerActivities] = await getActivites(lastMonth)

    // Try this month, then this past year, then just screw it and go all time
    if (activities.length) {
        return [activities, playerActivities] as const
    } else {
        const lastYear = new Date(today)
        lastYear.setMonth(today.getUTCFullYear() - 1)

        const [lastYearActivities, lastYearPlayerActivities] = await getActivites(lastYear)
        if (lastYearActivities.length) {
            return [lastYearActivities, lastYearPlayerActivities] as const
        } else {
            return getActivites(new Date(0))
        }
    }
}
