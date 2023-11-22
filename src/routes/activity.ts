import { Request, Response, Router } from "express"
import { bigIntString, failure, success } from "~/util"
import { prisma } from "~/prisma"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { AllRaidHashes } from "./manifest"
import { isContest, isDayOne, isWeekOne } from "~/data/raceDates"
import { cacheControl } from "~/middlewares/cache-control"
import { zodParamsParser } from "~/middlewares/parsers"
import { z } from "zod"

export const activityRouter = Router()

activityRouter.use(cacheControl(300))

const ActivityParamSchema = z.object({
    instanceId: bigIntString
})

activityRouter.get("/:instanceId", zodParamsParser(ActivityParamSchema), async (req, res, next) => {
    const activityId = req.params.instanceId

    try {
        const data = await getActivity({ activityId })
        res.status(200).json(success(data))
    } catch (e) {
        if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
            res.status(404).json(failure(`No activity found with id ${activityId}`))
        } else {
            next(e)
        }
    }
})

async function getActivity({ activityId }: { activityId: bigint }) {
    const { playerActivity, activityLeaderboardEntry, ...activity } =
        await prisma.activity.findUniqueOrThrow({
            where: {
                instanceId: activityId
            },
            include: {
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

    const { raid } = AllRaidHashes[String(activity.raidHash)]
    const dayOne = isDayOne(raid, activity.dateCompleted)
    const contest = isContest(raid, activity.dateStarted)
    const weekOne = isWeekOne(raid, activity.dateCompleted)

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
