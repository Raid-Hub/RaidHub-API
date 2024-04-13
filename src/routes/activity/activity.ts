import { RaidHubRoute } from "../../RaidHubRoute"
import { isContest, isDayOne, isWeekOne } from "../../data/raceDates"
import { ListedRaids } from "../../data/raids"
import { cacheControl } from "../../middlewares/cache-control"
import {
    ErrorCode,
    zActivityEnum,
    zActivityExtended,
    zPlayerWithExtendedActivityData,
    zVersionEnum
} from "../../schema/common"
import { z, zBigIntString } from "../../schema/zod"
import { prisma } from "../../services/prisma"
import { includedIn } from "../../util/helpers"
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
                        activityId: zActivityEnum,
                        activityName: z.string(),
                        versionId: zVersionEnum,
                        versionName: z.string()
                    }),
                    leaderboardEntries: z.record(z.number()),
                    players: z.array(zPlayerWithExtendedActivityData)
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
                            emblemHash: true,
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
                            meleeKills: true,
                            weapons: {
                                select: {
                                    weaponHash: true,
                                    kills: true,
                                    precisionKills: true
                                }
                            }
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

    const dayOne =
        includedIn(ListedRaids, activityHash.activityDefinition.id) &&
        isDayOne(activityHash.activityDefinition.id, activity.dateCompleted)

    const contest =
        includedIn(ListedRaids, activityHash.activityDefinition.id) &&
        isContest(activityHash.activityDefinition.id, activity.dateStarted)

    const weekOne =
        includedIn(ListedRaids, activityHash.activityDefinition.id) &&
        isWeekOne(activityHash.activityDefinition.id, activity.dateCompleted)

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
        players: activityPlayers.map(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ({ player, instanceId, membershipId, characters, ...data }) => ({
                player,
                data: {
                    ...data,
                    characters: characters.map(({ weapons, ...character }) => ({
                        ...character,
                        weapons
                    }))
                }
            })
        )
    }
}
