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
                        raid: zRaidEnum,
                        raidName: z.string(),
                        version: zRaidVersionEnum,
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
            raidDefinition: {
                select: {
                    raid: true,
                    version: true
                }
            },
            playerActivity: {
                include: {
                    player: true
                },
                orderBy: [
                    {
                        finishedRaid: "desc"
                    },
                    {
                        kills: "desc"
                    }
                ]
            },
            activityLeaderboardEntry: {
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

    const { activityLeaderboardEntry, playerActivity, raidDefinition, ...activity } = result

    const dayOne = isDayOne(raidDefinition.raid.id, activity.dateCompleted)
    const contest = isContest(raidDefinition.raid.id, activity.dateStarted)
    const weekOne = isWeekOne(raidDefinition.raid.id, activity.dateCompleted)

    return {
        ...activity,
        leaderboardEntries: Object.fromEntries(
            activityLeaderboardEntry.map(e => [e.leaderboard.type.toLowerCase(), e.rank])
        ),
        dayOne,
        contest,
        weekOne,
        meta: {
            raid: raidDefinition.raid.id,
            raidName: raidDefinition.raid.name,
            version: raidDefinition.version.id,
            versionName: raidDefinition.version.name
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        players: playerActivity.map(({ player, instanceId, membershipId, ...data }) => ({
            ...player,
            data
        }))
    }
}
