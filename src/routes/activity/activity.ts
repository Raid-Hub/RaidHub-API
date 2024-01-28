import { RaidHubRoute } from "../../RaidHubRoute"
import { isContest, isDayOne, isWeekOne } from "../../data/raceDates"
import { cacheControl } from "../../middlewares/cache-control"
import { zActivityExtended } from "../../schema/common"
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
            return fail({ notFound: true, instanceId: req.params.instanceId }, "Activity not found")
        } else {
            return ok(data)
        }
    },
    response: {
        success: {
            statusCode: 200,
            schema: zActivityExtended
                .extend({
                    leaderboardEntries: z.record(z.number()),
                    players: z.record(
                        z.object({
                            finishedRaid: z.boolean(),
                            creditedSherpas: z.number(),
                            isFirstClear: z.boolean()
                        })
                    )
                })
                .strict()
        },
        error: {
            statusCode: 404,
            schema: z.object({
                type: z.literal("ActivityNotFoundError"),
                notFound: z.literal(true),
                instanceId: zBigIntString()
            })
        }
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
                    raidId: true
                }
            },
            playerActivity: {
                select: {
                    finishedRaid: true,
                    membershipId: true,
                    sherpas: true,
                    isFirstClear: true
                }
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

    const dayOne = isDayOne(raidDefinition.raidId, activity.dateCompleted)
    const contest = isContest(raidDefinition.raidId, activity.dateStarted)
    const weekOne = isWeekOne(raidDefinition.raidId, activity.dateCompleted)

    return {
        ...activity,
        leaderboardEntries: Object.fromEntries(
            activityLeaderboardEntry.map(e => [e.leaderboard.type.toLowerCase(), e.rank])
        ),
        dayOne,
        contest,
        weekOne,
        players: Object.fromEntries(
            playerActivity.map(pa => [
                pa.membershipId,
                {
                    finishedRaid: pa.finishedRaid,
                    creditedSherpas: pa.sherpas,
                    isFirstClear: pa.isFirstClear
                }
            ])
        )
    }
}
