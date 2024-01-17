import { z } from "zod"
import { RaidHubRoute, fail, ok } from "../../RaidHubRoute"
import { zBigIntString } from "../../util/zod-common"
import { cacheControl } from "../../middlewares/cache-control"
import { prisma } from "../../prisma"
import { isContest, isDayOne, isWeekOne } from "../../data/raceDates"

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
                404,
                "Activity not found"
            )
        } else {
            return ok(data)
        }
    },
    response: {
        success: z
            .object({
                instanceId: zBigIntString(),
                raidHash: zBigIntString(),
                dateStarted: z.date(),
                dateCompleted: z.date(),
                fresh: z.boolean().nullable(),
                flawless: z.boolean().nullable(),
                completed: z.boolean(),
                playerCount: z.number(),
                platformType: z.number(),
                leaderboardEntries: z.record(z.number()),
                players: z.record(
                    z.object({
                        finishedRaid: z.boolean(),
                        sherpas: z.number(),
                        isFirstClear: z.boolean()
                    })
                ),
                dayOne: z.boolean(),
                contest: z.boolean(),
                weekOne: z.boolean()
            })
            .strict(),
        error: z.object({
            notFound: z.boolean(),
            instanceId: zBigIntString()
        })
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
                String(pa.membershipId),
                {
                    finishedRaid: pa.finishedRaid,
                    sherpas: pa.sherpas,
                    isFirstClear: pa.isFirstClear
                }
            ])
        )
    }
}
