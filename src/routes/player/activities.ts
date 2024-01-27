import { RaidHubRoute } from "../../RaidHubRoute"
import { isContest, isDayOne } from "../../data/raceDates"
import { zActivityWithPlayerData, zRaidEnum, zRaidVersionEnum } from "../../schema/common"
import { z, zBigIntString, zCount } from "../../schema/zod"
import { prisma } from "../../services/prisma"
import { fail, ok } from "../../util/response"
import { playerRouterParams } from "./_schema"

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
    middlewares: [
        (req, res, next) => {
            // save the previous send method
            const _send = res.send.bind(res)

            // override the json method to cache with 200's
            res.send = body => {
                if (res.statusCode === 200) {
                    // Cache for 1 day if we have a cursor, otherwise 30 seconds
                    res.setHeader("Cache-Control", `max-age=${req.query.cursor ? 86400 : 30}`)
                }
                return _send(body)
            }
            next()
        }
    ],
    async handler(req) {
        const { membershipId } = req.params
        const { cursor, count } = req.query
        const data = await getPlayerActivities({
            membershipId,
            cursor,
            count
        })
        if (!data) {
            return fail({ membershipId, notFound: true }, "Player not found")
        } else {
            return ok(data)
        }
    },
    response: {
        success: z
            .object({
                activities: z.array(
                    zActivityWithPlayerData.extend({
                        raidHash: zBigIntString(),
                        raidId: zRaidEnum,
                        versionId: zRaidVersionEnum
                    })
                ),
                nextCursor: zBigIntString().nullable()
            })
            .strict(),
        error: z.object({
            notFound: z.literal(true),
            membershipId: zBigIntString()
        })
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
        select: {
            instanceId: true,
            dateStarted: true,
            dateCompleted: true,
            completed: true,
            fresh: true,
            flawless: true,
            playerCount: true,
            platformType: true,
            raidDefinition: {
                select: {
                    raidHash: true,
                    raidId: true,
                    versionId: true
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
        select: {
            finishedRaid: true,
            kills: true,
            assists: true,
            deaths: true,
            timePlayedSeconds: true,
            classHash: true,
            sherpas: true,
            isFirstClear: true
        },
        take: count + 1,
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
    const [player, [activities, playerActivities]] = await Promise.all([
        prisma.player.findUnique({ select: { membershipId: true }, where: { membershipId } }),
        // If a cursor is provided
        Promise.all(
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
    ])

    if (!player) return null

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
        activities: activities.slice(0, count).map(({ raidDefinition, ...a }, i) => {
            return {
                ...a,
                dayOne: isDayOne(raidDefinition.raidId, a.dateCompleted),
                contest: isContest(raidDefinition.raidId, a.dateStarted),
                raid: {
                    ...raidDefinition
                },
                player: playerActivities[i]
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
