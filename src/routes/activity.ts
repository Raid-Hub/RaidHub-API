import express, { Request, Response } from "express"
import { failure, success } from "../util"
import { prisma } from "../database"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"

export const activityRouter = express.Router()

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

    return {
        ...activity,
        players: Object.fromEntries(playerActivities.map(pa => [pa.membershipId, pa.finishedRaid]))
    }
}
