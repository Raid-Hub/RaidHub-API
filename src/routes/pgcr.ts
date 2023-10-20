import express, { Request, Response } from "express"
import { failure, success } from "../util"
import { prisma } from "../database"

export const pgcrRouter = express.Router()

pgcrRouter.get("/:activityId", async (req: Request, res: Response) => {
    const activityId = req.params.activityId

    try {
        const data = await getActivity(activityId)
        return res.status(200).json(success(data))
    } catch (e) {
        res.status(500).json(failure(e, "Internal server error"))
    }
})

async function getActivity(activityId: string) {
    return prisma.rawPGCR.findUniqueOrThrow({
        where: {
            id: activityId
        }
    })
}
