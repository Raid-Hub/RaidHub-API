import { RaidHubRoute } from "../../RaidHubRoute"
import { cacheControl } from "../../middlewares/cache-control"
import { prisma } from "../../services/prisma"
import { ok } from "../../util/response"
import { z } from "../../util/zod"

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
