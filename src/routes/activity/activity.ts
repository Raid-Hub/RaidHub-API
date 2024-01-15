import { failure, success } from "util/helpers"
import { prisma } from "~/prisma"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { isContest, isDayOne, isWeekOne } from "~/data/raceDates"
import { cacheControl } from "~/middlewares/cache-control"
import { z } from "zod"
import { RaidHubRoute } from "route"
import { zBigIntString } from "util/zod-common"

export const activityRootRoute = new RaidHubRoute({
    path: "/:instanceId",
    method: "get",
    params: z.object({
        instanceId: zBigIntString()
    }),
    middlewares: [cacheControl(300)],
    async handler(req, res, next) {
        const instanceId = req.params.instanceId
        try {
            const data = await getActivity({ instanceId })
            res.status(200).json(success(data))
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                res.status(404).json(failure(`No activity found with id ${instanceId}`))
            } else {
                next(e)
            }
        }
    }
})

async function getActivity({ instanceId }: { instanceId: bigint }) {
    const { playerActivity, activityLeaderboardEntry, ...activity } =
        await prisma.activity.findUniqueOrThrow({
            where: {
                instanceId
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
                        membershipId: true
                    }
                },
                activityLeaderboardEntry: {
                    select: {
                        leaderboardId: true,
                        rank: true
                    }
                }
            }
        })

    const dayOne = isDayOne(activity.raidDefinition.raidId, activity.dateCompleted)
    const contest = isContest(activity.raidDefinition.raidId, activity.dateStarted)
    const weekOne = isWeekOne(activity.raidDefinition.raidId, activity.dateCompleted)

    return {
        ...activity,
        leaderboardEntries: Object.fromEntries(
            activityLeaderboardEntry.map(e => [e.leaderboardId, e.rank])
        ),
        instanceId: String(activity.instanceId),
        raidHash: String(activity.raidHash),
        activityId: String(activity.instanceId),
        dayOne,
        contest,
        weekOne,
        players: Object.fromEntries(
            playerActivity.map(pa => [String(pa.membershipId), pa.finishedRaid])
        )
    }
}
