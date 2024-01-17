import { RaidHubRoute, ok } from "../../RaidHubRoute"
import { cacheControl } from "../../middlewares/cache-control"
import { prisma } from "../../prisma"
import { z } from "zod"

export const adminQueryRoute = new RaidHubRoute({
    method: "post",
    body: z.object({
        query: z.string()
    }),
    middlewares: [cacheControl(5)],
    async handler(req) {
        const data = await prisma.$queryRawUnsafe<Object[]>(req.body.query)

        return ok(data)
    },
    response: {
        success: z.array(z.object({})),
        error: z.object({})
    }
})
