import { Request, Response, Router } from "express"
import { failure, success } from "~/util"
import { prisma } from "~/prisma"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { AllRaidHashes } from "./manifest"
import { isContest, isDayOne, isWeekOne } from "~/data/raceDates"

export const activityRouter = Router()

activityRouter.use((req, res, next) => {
    // cache for 5 minutes
    res.setHeader("Cache-Control", "max-age=300")
    next()
})

activityRouter.get("/:activityId", async (req: Request, res: Response) => {
    try {
        const activityId = BigInt(req.params.activityId)
        try {
            const data = await getActivity({ activityId })
            res.status(200).json(success(data))
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError) {
                if (e.code === "P2025") {
                    res.status(404).json(failure(`No activity found with id ${activityId}`))
                } else {
                    console.error(e)
                    res.status(500).json(failure(e, "Internal server error"))
                }
            } else {
                console.error(e)
                res.status(500).json(failure(e, "Internal server error"))
            }
        }
    } catch (e) {
        res.status(400).json(failure({ activityId: req.params.activityId }, "Invalid activityId"))
    }
})

async function getActivity({ activityId }: { activityId: bigint }) {
    const { playerActivity, activityLeaderboardEntry, ...activity } = await prisma.activity.findUniqueOrThrow({
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
        leaderboardEntries: Object.fromEntries(activityLeaderboardEntry.map(e => [e.leaderboardId, e.rank])),
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
