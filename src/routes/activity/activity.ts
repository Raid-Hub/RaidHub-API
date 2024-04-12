import { RaidHubRoute } from "../../RaidHubRoute"
import { isContest, isDayOne, isWeekOne } from "../../data/raceDates"
import { cacheControl } from "../../middlewares/cache-control"
import {
    ErrorCode,
    zActivityExtended,
    zPlayerWithActivityData,
    zRaidEnum,
    zRaidVersionEnum
} from "../../schema/common"
import { z, zBigIntString } from "../../schema/zod"
import { prisma } from "../../services/prisma"
import { fail, ok } from "../../util/response"

export const activityRootRoute = new RaidHubRoute({
    method: "get",
    params: z.object({
        instanceId: zBigIntString()
    }),
    middlewares: [cacheControl(300)],
    async handler(req) {
        const instanceId = req.params.instanceId

        const data = await getActivity({ instanceId })

        if (!data) {
            return fail(
                { notFound: true, instanceId: req.params.instanceId },
                ErrorCode.ActivityNotFoundError,
                "Activity not found"
            )
        } else {
            return ok(data)
        }
    },
    response: {
        success: {
            statusCode: 200,
            schema: zActivityExtended
                .extend({
                    meta: z.object({
                        activityId: zRaidEnum,
                        activityName: z.string(),
                        versionId: zRaidVersionEnum,
                        versionName: z.string()
                    }),
                    leaderboardEntries: z.record(z.number()),
                    players: z.array(zPlayerWithActivityData)
                })
                .strict()
        },
        errors: [
            {
                statusCode: 404,
                type: ErrorCode.ActivityNotFoundError,
                schema: z.object({
                    notFound: z.literal(true),
                    instanceId: zBigIntString()
                })
            }
        ]
    }
})

async function getActivity({ instanceId }: { instanceId: bigint }) {
    const result = await prisma.activity.findUnique({
        where: {
            instanceId: instanceId
        },
        include: {
            activityHash: {
                select: {
                    activityDefinition: true,
                    versionDefinition: true
                }
            },
            activityPlayers: {
                include: {
                    player: {
                        select: {
                            membershipId: true,
                            membershipType: true,
                            displayName: true,
                            bungieGlobalDisplayName: true,
                            bungieGlobalDisplayNameCode: true,
                            iconPath: true,
                            lastSeen: true
                        }
                    },
                    characters: {
                        select: {
                            characterId: true,
                            classHash: true,
                            completed: true,
                            timePlayedSeconds: true,
                            startSeconds: true,
                            score: true,
                            kills: true,
                            assists: true,
                            deaths: true,
                            precisionKills: true,
                            superKills: true,
                            grenadeKills: true,
                            meleeKills: true
                        },
                        orderBy: [
                            {
                                completed: "desc"
                            },
                            {
                                score: "desc"
                            },
                            {
                                kills: "desc"
                            }
                        ]
                    }
                },
                orderBy: [
                    {
                        completed: "desc"
                    },
                    {
                        timePlayedSeconds: "desc"
                    }
                ]
            },
            activityLeaderboardEntries: {
                select: {
                    leaderboard: {
                        select: {
                            type: true
                        }
                    },
                    rank: true
                }
            }
        }
    })

    if (!result) return false

    const { activityLeaderboardEntries, activityPlayers, activityHash, ...activity } = result

    const dayOne = activityHash.activityDefinition.isRaid
        ? isDayOne(activityHash.activityDefinition.id, activity.dateCompleted)
        : false
    const contest = activityHash.activityDefinition.isRaid
        ? isContest(activityHash.activityDefinition.id, activity.dateStarted)
        : false
    const weekOne = activityHash.activityDefinition.isRaid
        ? isWeekOne(activityHash.activityDefinition.id, activity.dateCompleted)
        : false

    return {
        ...activity,
        leaderboardEntries: Object.fromEntries(
            activityLeaderboardEntries.map(e => [e.leaderboard.type.toLowerCase(), e.rank])
        ),
        dayOne,
        contest,
        weekOne,
        meta: {
            activityId: activityHash.activityDefinition.id,
            activityName: activityHash.activityDefinition.name,
            versionId: activityHash.versionDefinition.id,
            versionName: activityHash.versionDefinition.name
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        players: activityPlayers.map(({ player, instanceId, membershipId, ...data }) => ({
            ...player,
            data
        }))
    }
}
