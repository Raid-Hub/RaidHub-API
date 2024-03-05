import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { RaidHubRoute } from "../../RaidHubRoute"
import { cacheControl } from "../../middlewares/cache-control"
import { ErrorCode, registry } from "../../schema/common"
import { z } from "../../schema/zod"
import { prisma } from "../../services/prisma"
import { fail, ok } from "../../util/response"

export const adminQueryRoute = new RaidHubRoute({
    method: "post",
    body: z.object({
        query: z.string(),
        type: z.enum(["SELECT", "EXPLAIN"]),
        ignoreCost: z.boolean().default(false)
    }),
    middlewares: [cacheControl(5)],
    async handler(req) {
        try {
            if (req.body.type === "EXPLAIN") {
                const explained = await explainQuery(req.body.query)
                return ok({
                    data: explained.map(r => r["QUERY PLAN"]),
                    type: "EXPLAIN" as const
                })
            }

            // Wrap the query in a subquery to limit the number of rows returned
            // This is not a security measure, but rather a way to prevent the server from
            // returning too much data at once. The client is trusted to not abuse this, but
            // the server will still enforce the limit to prevent mistakes.
            const wrappedQuery = `SELECT * FROM (${req.body.query.replace(
                ";",
                ""
            )}) AS foo LIMIT 50`

            if (req.body.ignoreCost) {
                const rows =
                    await prisma.$queryRawUnsafe<{ [column: string]: unknown }[]>(wrappedQuery)
                return ok({ data: rows, type: "SELECT" as const })
            }

            const explained = await explainQuery(wrappedQuery)
            const costString = explained[0]["QUERY PLAN"]
                .split(" ")
                .find(s => s.startsWith("(cost="))!
            const minCostString = costString.substring(
                costString.indexOf("=") + 1,
                costString.indexOf("..")
            )
            const maxCostString = costString.substring(costString.indexOf("..") + 2)
            const minCost = parseFloat(minCostString)
            const maxCost = parseFloat(maxCostString)

            if (maxCost > 1_000_000) {
                return ok({
                    data: null,
                    type: "HIGH COST" as const,
                    cost: maxCost,
                    estimatedDuration: (minCost + maxCost) / 2 / 100_000
                })
            }

            const rows = await prisma.$queryRawUnsafe<{ [column: string]: unknown }[]>(wrappedQuery)

            return ok({ data: rows, type: "SELECT" as const })
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code.startsWith("P2")) {
                return fail(
                    { name: e.name, code: e.code, message: e.meta?.message },
                    ErrorCode.AdminQuerySyntaxError,
                    "Query syntax error"
                )
            }
            throw e
        }
    },
    response: {
        success: {
            statusCode: 200,
            schema: z.discriminatedUnion("type", [
                z.object({
                    type: z.literal("SELECT"),
                    data: z.array(z.record(z.unknown()))
                }),
                z.object({
                    type: z.literal("HIGH COST"),
                    data: z.null(),
                    cost: z.number(),
                    estimatedDuration: z.number()
                }),
                z.object({
                    type: z.literal("EXPLAIN"),
                    data: z.array(z.string())
                })
            ])
        },
        errors: [
            {
                type: ErrorCode.AdminQuerySyntaxError,
                statusCode: 501,
                schema: registry.register(
                    "AdminQuerySyntaxError",
                    z.object({
                        name: z.string(),
                        code: z.string(),
                        message: z.string()
                    })
                )
            }
        ]
    }
})

async function explainQuery(query: string) {
    return prisma.$queryRawUnsafe<{ "QUERY PLAN": string }[]>(`EXPLAIN ${query}`)
}
