import express, {Request, Response} from "express"
import {success} from "../util"
import {prisma} from "../database"

export const pgcrRouter = express.Router()

pgcrRouter.get("/:activityId", async (req: Request, res: Response) => {
    const activityId = req.params.activityId

    const data = await getActivity(activityId)
    return res.status(200).json(success(data))
})

async function getActivity(activityId: string) {
    return await prisma.activity.findUniqueOrThrow({
        where: {
            activityId: activityId
        }
    })
}
