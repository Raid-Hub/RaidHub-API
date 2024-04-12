import { Prisma } from "@prisma/client"
import { RaidHubRoute } from "../../RaidHubRoute"
import { isContest, isDayOne, isWeekOne } from "../../data/raceDates"
import {
    ErrorCode,
    zActivityWithPlayerData,
    zRaidEnum,
    zRaidVersionEnum
} from "../../schema/common"
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
            return fail({ membershipId, notFound: true }, ErrorCode.PlayerNotFoundError)
        } else {
            return ok(data)
        }
    },
    response: {
        success: {
            statusCode: 200,
            schema: z
                .object({
                    membershipId: zBigIntString(),
                    activities: z.array(
                        zActivityWithPlayerData.extend({
                            meta: z.object({
                                activityId: zRaidEnum,
                                versionId: zRaidVersionEnum
                            })
                        })
                    ),
                    nextCursor: zBigIntString().nullable()
                })
                .strict()
        },
        errors: [
            {
                statusCode: 404,
                type: ErrorCode.PlayerNotFoundError,
                schema: z.object({
                    notFound: z.literal(true),
                    membershipId: zBigIntString()
                })
            }
        ]
    }
})

const activityQuery = (membershipId: bigint, count: number) =>
    ({
        where: {
            activityPlayers: {
                some: {
                    membershipId: membershipId
                }
            }
        },
        orderBy: {
            dateCompleted: "desc"
        },
        include: {
            activityHash: {
                select: {
                    activityDefinition: {
                        select: {
                            id: true,
                            isRaid: true
                        }
                    },
                    versionId: true
                }
            }
        },

        take: count + 1
    }) satisfies Prisma.ActivityFindManyArgs

const playerActivityQuery = (membershipId: bigint, count: number) =>
    ({
        where: {
            membershipId: membershipId
        },
        select: {
            completed: true,
            sherpas: true,
            isFirstClear: true
        },
        take: count + 1,
        orderBy: {
            activity: {
                dateCompleted: "desc"
            }
        }
    }) satisfies Prisma.ActivityPlayerFindManyArgs

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
                      prisma.activityPlayer.findMany({
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
        membershipId,
        nextCursor: nextCursor ? String(nextCursor) : null,
        activities: activities.slice(0, count).map(({ activityHash, ...a }, i) => {
            return {
                meta: {
                    activityId: activityHash.activityDefinition.id,
                    versionId: activityHash.versionId
                },
                ...a,
                dayOne: activityHash.activityDefinition.isRaid
                    ? isDayOne(activityHash.activityDefinition.id, a.dateCompleted)
                    : false,
                contest: activityHash.activityDefinition.isRaid
                    ? isContest(activityHash.activityDefinition.id, a.dateStarted)
                    : false,
                weekOne: activityHash.activityDefinition.isRaid
                    ? isWeekOne(activityHash.activityDefinition.id, a.dateCompleted)
                    : false,
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

    const { where: whereActivity, ...queryActivity } = activityQuery(membershipId, count)
    const { where: whereActivityPlayer, ...queryActivityPlayer } = playerActivityQuery(
        membershipId,
        count
    )

    const getActivites = (cutoff: Date) =>
        Promise.all([
            prisma.activity.findMany({
                ...queryActivity,
                where: {
                    dateCompleted: {
                        gte: cutoff
                    },
                    ...whereActivity
                }
            }),
            prisma.activityPlayer.findMany({
                where: {
                    ...whereActivityPlayer,
                    activity: {
                        dateCompleted: {
                            gte: cutoff
                        }
                    }
                },
                ...queryActivityPlayer
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
        lastYear.setFullYear(today.getUTCFullYear() - 1)

        const [lastYearActivities, lastYearPlayerActivities] = await getActivites(lastYear)
        if (lastYearActivities.length) {
            return [lastYearActivities, lastYearPlayerActivities] as const
        } else {
            return getActivites(new Date(0))
        }
    }
}
