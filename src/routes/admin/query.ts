import { RaidHubRoute } from "../../RaidHubRoute"
import { cacheControl } from "../../middlewares/cache-control"
import { z } from "../../schema/zod"
import { prisma } from "../../services/prisma"
import { ok } from "../../util/response"

export const adminQueryRoute = new RaidHubRoute({
    method: "post",
    body: z.object({
        query: z.string()
    }),
    middlewares: [cacheControl(5)],
    async handler(req) {
        const rows = await prisma.$queryRawUnsafe<unknown[]>(req.body.query)

        return ok(rows)
    },
    response: {
        success: z.array(z.any())
    }
})
