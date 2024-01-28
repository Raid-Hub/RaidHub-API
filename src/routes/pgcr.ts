import { gunzipSync } from "zlib"
import { RaidHubRoute } from "../RaidHubRoute"
import { cacheControl } from "../middlewares/cache-control"
import { zPgcrSchema } from "../schema/pgcr"
import { z, zBigIntString } from "../schema/zod"
import { prisma } from "../services/prisma"
import { fail, ok } from "../util/response"

export const pgcrRoute = new RaidHubRoute({
    method: "get",
    params: z.object({
        instanceId: zBigIntString()
    }),
    middlewares: [cacheControl(86400)],
    async handler({ params }) {
        const instanceId = params.instanceId
        const bytes = await getRawPGCRBytes({ instanceId })
        if (bytes === null) {
            return fail({ notFound: true, instanceId }, `No activity found with id ${instanceId}`)
        } else {
            const data = decompressGzippedBytes(bytes)
            return ok(data)
        }
    },
    response: {
        success: {
            statusCode: 200,
            schema: zPgcrSchema.strict()
        },
        error: {
            statusCode: 404,
            schema: z.object({
                type: z.literal("PGCRNotFoundError"),
                notFound: z.literal(true),
                instanceId: zBigIntString()
            })
        }
    }
})

async function getRawPGCRBytes({ instanceId }: { instanceId: bigint }) {
    const rows: [{ data: Buffer }] = await prisma.$queryRaw`
    SELECT DISTINCT data 
    FROM pgcr 
    WHERE instance_id = ${instanceId}`

    if (rows.length !== 1) return null

    return rows[0].data
}

function decompressGzippedBytes(bytes: Buffer) {
    const decompressed = gunzipSync(bytes).toString("utf8")
    const json = JSON.parse(decompressed)

    return json
}
