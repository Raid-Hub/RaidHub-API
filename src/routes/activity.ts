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
    const activityId = req.params.activityId

    try {
        const data = await getActivity({ activityId })
        res.status(200).json(success(data))
    } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
            if (e.code === "P2025") {
                res.status(404).json(failure(`No activity found with id ${activityId}`))
            } else {
                res.status(500).json(failure(e, "Internal server error"))
            }
        } else {
            res.status(500).json(failure(e, "Internal server error"))
        }
    }
})

async function getActivity({ activityId }: { activityId: string }) {
    const { playerActivities, ...activity } = await prisma.activity.findUniqueOrThrow({
        where: {
            activityId
        },
        include: {
            playerActivities: {
                select: {
                    finishedRaid: true,
                    membershipId: true
                }
            }
        }
    })

    const { raid } = AllRaidHashes[activity.raidHash]
    const dayOne = isDayOne(raid, activity.dateCompleted)
    const contest = isContest(raid, activity.dateStarted)
    const weekOne = isWeekOne(raid, activity.dateCompleted)

    return {
        ...activity,
        dayOne,
        contest,
        weekOne,
        players: Object.fromEntries(playerActivities.map(pa => [pa.membershipId, pa.finishedRaid]))
    }
}
