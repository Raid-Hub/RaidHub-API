import { Request, Response, Router } from "express"
import { failure, success } from "~/util"
import { prisma } from "~/prisma"

export const pgcrRouter = Router()

pgcrRouter.use((_, res, next) => {
    // cache for 1 hour
    res.setHeader("Cache-Control", "max-age=3600")
    next()
})

pgcrRouter.get("/:activityId", async (req: Request, res: Response) => {
    const activityId = req.params.activityId

    try {
        const data = await getPGCR(activityId)
        console.log(data)

        res.status(200).json(success(data))
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
