import express, { Request, Response } from "express"
import { failure, success } from "../util"
import { prisma } from "../database"

export const pgcrRouter = express.Router()

pgcrRouter.get("/:activityId", async (req: Request, res: Response) => {
    const activityId = req.params.activityId

    try {
        const data = await getPGCR(activityId)
        console.log(data)

        return res.status(200).json(success(data))
    } catch (e) {
        res.status(500).json(failure(e, "Internal server error"))
    }
})

async function getPGCR(activityId: string) {
    const data = await prisma.rawPGCR.findUniqueOrThrow({
        where: {
            id: activityId
        }
    })
    // @ts-ignore
    return JSON.parse(data.rawJson)
}
