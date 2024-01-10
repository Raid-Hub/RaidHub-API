import { Router } from "express"
import { z } from "zod"
import { cacheControl } from "~/middlewares/cache-control"
import { zodBodyParser, zodQueryParser } from "~/middlewares/parsers"
import { prisma } from "~/prisma"
import { failure, success } from "~/util"

export const adminSqlQueryRouter = Router()
adminSqlQueryRouter.use(cacheControl(5))

const AdminSqlParamSchema = z.object({
    query: z.string()
})

adminSqlQueryRouter.post("/", zodBodyParser(AdminSqlParamSchema), async (req, res, next) => {
    const query = req.body.query

    try {
        const data = await prisma.$queryRawUnsafe<Object[]>(query)
        res.status(200).json(success(data))
    } catch (e) {
        res.status(500).json(failure(e, "Something went wrong executing the query"))
    }
})
