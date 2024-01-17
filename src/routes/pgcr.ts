import { prisma } from "../prisma"
import { gunzipSync } from "zlib"
import { cacheControl } from "../middlewares/cache-control"
import { z } from "zod"
import { RaidHubRoute, fail, ok } from "../RaidHubRoute"
import { zBigIntString } from "../util/zod-common"
import { pgcrSchema } from "../util/pgcr"

export const pgcrRoute = new RaidHubRoute({
    method: "get",
    params: z.object({
        instanceId: zBigIntString()
    }),
    middlewares: [cacheControl(86400)],
    async handler({ params }) {
        const instanceId = params.instanceId
        const bytes = await getRawPGCRBytes({ instanceId })
        if (bytes === null)
            return fail(
                { notFound: true, instanceId },
                404,
                `No activity found with id ${instanceId}`
            )
        const data = decompressGzippedBytes(bytes)
        return ok(data)
    },
    response: {
        success: pgcrSchema.strict(),
        error: z.object({
            notFound: z.boolean(),
            instanceId: zBigIntString()
        })
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
