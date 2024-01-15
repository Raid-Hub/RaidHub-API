import { failure, success } from "util/helpers"
import { prisma } from "~/prisma"
import { gunzipSync } from "zlib"
import { cacheControl } from "~/middlewares/cache-control"
import { z } from "zod"
import { RaidHubRoute } from "route"
import { zBigIntString } from "util/zod-common"

export const pgcrRoute = new RaidHubRoute({
    path: "/:instanceId",
    method: "get",
    params: z.object({
        instanceId: zBigIntString()
    }),
    middlewares: [cacheControl(86400)],
    async handler(req, res, next) {
        const instanceId = req.params.instanceId
        try {
            const bytes = await getRawPGCRBytes({ instanceId })
            const data = decompressGzippedBytes(bytes)
            res.status(200).json(success(data))
        } catch (e) {
            if (e instanceof Error && e.message === "No rows found") {
                res.status(404).json(failure(`No activity found with id ${instanceId}`))
            } else {
                next(e)
            }
        }
    }
})

async function getRawPGCRBytes({ instanceId }: { instanceId: bigint }) {
    const rows: [{ data: Buffer }] = await prisma.$queryRaw`
    SELECT DISTINCT data 
    FROM pgcr 
    WHERE instance_id = ${instanceId}`

    if (rows.length !== 1) throw new Error("No rows found")

    return rows[0].data
}

function decompressGzippedBytes(bytes: Buffer) {
    const decompressed = gunzipSync(bytes).toString("utf8")
    const json = JSON.parse(decompressed)

    return json
}
