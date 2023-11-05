import { Router } from "express"
import { failure, success } from "~/util"
import { prisma } from "~/prisma"
import { gunzipSync } from "zlib"

export const pgcrRouter = Router()

pgcrRouter.use((req, res, next) => {
    // cache for 1 day
    res.setHeader("Cache-Control", "max-age=86400")
    next()
})

pgcrRouter.get("/:instanceId", async (req, res) => {
    try {
        const instanceId = BigInt(req.params.instanceId)
        try {
            const bytes = await getRawPGCRBytes({ instanceId })
            const data = decompressGzippedBytes(bytes)
            res.status(200).json(success(data))
        } catch (e) {
            if (e instanceof Error) {
                if (e.message === "No rows found") {
                    return res.status(404).json(failure(`No activity found with id ${instanceId}`))
                }
            }
            console.error(e)
            return res.status(500).json(failure(e, "Internal server error"))
        }
    } catch (e) {
        res.status(400).json(failure({ activityId: req.params.instanceId }, "Invalid Instance Id"))
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
