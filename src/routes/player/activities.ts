import { Prisma } from "@prisma/client"
import { RaidHubRoute } from "../../RaidHubRoute"
import { isContest, isDayOne, isWeekOne } from "../../data/raceDates"
import { ListedRaids } from "../../data/raids"
import {
    ErrorCode,
    zActivityEnum,
    zActivityWithPlayerData,
    zVersionEnum
} from "../../schema/common"
import { z, zBigIntString, zCount } from "../../schema/zod"
import { prisma } from "../../services/prisma"
import { includedIn } from "../../util/helpers"
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
                                activityId: zActivityEnum,
                                versionId: zVersionEnum
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

interface ActivityResult {
    instanceId: bigint
    hash: bigint
    playerCount: number
    completed: boolean
    fresh: boolean | null
    flawless: boolean | null
    dateStarted: Date
    dateCompleted: Date
    duration: number
    platformType: number
    score: number
    player: {
        completed: boolean
        sherpas: number
        isFirstClear: boolean
        timePlayedSeconds: number
    }
    meta: {
        activityId: number
        versionId: number
    }
}

const generateActivityQuery = (
    membershipId: bigint,
    count: number,
    cursor?: bigint,
    cutoff?: Date
) =>
    Prisma.sql`SELECT 
            activity.instance_id AS "instanceId",
            activity.hash,
            activity.player_count AS "playerCount",
            activity.completed,
            activity.fresh,
            activity.flawless,
            activity.date_started AS "dateStarted",
            activity.date_completed AS "dateCompleted",
            activity.duration,
            activity.platform_type as "platformType",
            activity.score,
            JSONB_BUILD_OBJECT(
                'completed', activity_player.completed, 
                'sherpas', activity_player.sherpas,
                'isFirstClear', activity_player.is_first_clear,
                'timePlayedSeconds', activity_player.time_played_seconds
            ) as player,
            JSONB_BUILD_OBJECT(
                'activityId', activity_hash.activity_id, 
                'versionId', activity_hash.version_id
            ) as meta
        FROM activity
        JOIN activity_player ON activity_player.instance_id = activity.instance_id
        JOIN activity_hash ON activity.hash = activity_hash.hash
        WHERE activity_player.membership_id = ${membershipId}
        ${cursor ? Prisma.sql`AND activity.instance_id < ${cursor}` : Prisma.empty}
        ${cutoff ? Prisma.sql`AND activity.date_completed > ${cutoff}` : Prisma.empty}
        ORDER BY 
            activity.date_completed DESC
        LIMIT ${count};`

async function getPlayerActivities({
    membershipId,
    cursor,
    count
}: {
    membershipId: bigint
    cursor?: bigint
    count: number
}) {
    const [player, activities] = await Promise.all([
        prisma.player.findUnique({ select: { membershipId: true }, where: { membershipId } }),
        // If a cursor is provided

        cursor
            ? prisma.$queryRaw<ActivityResult[]>(generateActivityQuery(membershipId, count, cursor))
            : await getFirstPageOfActivities(membershipId, count)
    ])

    if (!player) return null

    const countFound = activities.length

    // If we found the max number of activities, we need to check if there are more
    // Or if this was a "first page" request, we need to check if there are more
    const nextCursor =
        countFound === count || (!cursor && countFound > 0)
            ? activities[countFound - 1].instanceId
            : null

    return {
        membershipId,
        nextCursor: nextCursor ? String(nextCursor) : null,
        activities: activities.slice(0, count - 1).map(({ player, meta, ...a }) => {
            return {
                ...a,
                dayOne:
                    includedIn(ListedRaids, meta.activityId) &&
                    isDayOne(meta.activityId, a.dateCompleted),
                contest:
                    includedIn(ListedRaids, meta.activityId) &&
                    isContest(meta.activityId, a.dateStarted),
                weekOne:
                    includedIn(ListedRaids, meta.activityId) &&
                    isWeekOne(meta.activityId, a.dateCompleted),
                player,
                meta
            }
        })
    }
}

/* This allows us to fetch the same set of activities for the first request each day, making caching just a bit better. We
    can cache subsequent pages, while leaving the first one open */
async function getFirstPageOfActivities(membershipId: bigint, count: number) {
    const today = new Date()
    today.setUTCHours(10, 0, 0, 0)

    const getActivites = (cutoff: Date) =>
        prisma.$queryRaw<ActivityResult[]>(
            generateActivityQuery(membershipId, count, undefined, cutoff)
        )

    const lastMonth = new Date(today)
    lastMonth.setMonth(today.getUTCMonth() - 1)

    const activities = await getActivites(lastMonth)

    // Try this month, then this past year, then just screw it and go all time
    if (activities.length) {
        return activities
    } else {
        const lastYear = new Date(today)
        lastYear.setFullYear(today.getUTCFullYear() - 1)

        const lastYearActivities = await getActivites(lastYear)
        if (lastYearActivities.length) {
            return lastYearActivities
        } else {
            return await getActivites(new Date(0))
        }
    }
}
