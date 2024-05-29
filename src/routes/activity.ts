import { z } from "zod"
import { RaidHubRoute } from "../RaidHubRoute"
import { getInstanceExtended } from "../data-access-layer/instance"
import { cacheControl } from "../middlewares/cache-control"
import { zInstanceExtended } from "../schema/components/InstanceExtended"
import { ErrorCode } from "../schema/errors/ErrorCode"
import { zBigIntString } from "../schema/util"

export const activityRoute = new RaidHubRoute({
    method: "get",
    description:
        "This endpoint replaces the PGCR endpoint. It returns an object with a shape more aligned with how RaidHub displays PGCRs.",
    params: z.object({
        instanceId: zBigIntString()
    }),
    middleware: [cacheControl(300)],
    response: {
        success: {
            statusCode: 200,
            schema: zInstanceExtended
        },
        errors: [
            {
                statusCode: 404,
                code: ErrorCode.InstanceNotFoundError,
                schema: z.object({
                    instanceId: zBigIntString()
                })
            }
        ]
    },
    async handler(req) {
        const instanceId = req.params.instanceId

        const data = await getInstanceExtended(instanceId)

        if (!data) {
            return RaidHubRoute.fail(ErrorCode.InstanceNotFoundError, {
                instanceId: req.params.instanceId
            })
        } else {
            return RaidHubRoute.ok(data)
        }
    }
})
