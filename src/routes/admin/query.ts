import { RaidHubRoute } from "route"
import { z } from "zod"
import { cacheControl } from "~/middlewares/cache-control"
import { prisma } from "~/prisma"
import { failure, success } from "util/helpers"

export const adminQueryRoute = new RaidHubRoute({
    path: "/query",
    method: "post",
    body: z.object({
        query: z.string()
    }),
    middlewares: [cacheControl(5)],
    async handler(req, res, next) {
        try {
            const data = await prisma.$queryRawUnsafe<Object[]>(req.body.query)
            res.status(200).json(success(data))
        } catch (e) {
            res.status(500).json(failure(e, "Something went wrong executing the query"))
        }
    }
})
