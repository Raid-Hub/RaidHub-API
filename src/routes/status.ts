import { getCommonSettings } from "bungie-net-core/endpoints/Core"
import { z } from "zod"
import { RaidHubRoute } from "../RaidHubRoute"
import { cacheControl } from "../middlewares/cache-control"
import { zISODateString } from "../schema/util"
import { bungiePlatformHttp } from "../services/bungie/client"
import { postgres } from "../services/postgres"
import { getAtlasStatus } from "../services/prometheus/getAtlasStatus"

// This state tracks the status of the Destiny API and debounces it with a grace period of 60 seconds.
export const statusState = {
    timeoutDuration: 60000,
    isDestinyApiEnabled: true,
    timer: null as Timer | null,
    queueApiOfflineEvent: function () {
        if (this.timer) {
            clearTimeout(this.timer)
        }

        if (!this.isDestinyApiEnabled) return

        this.timer = setTimeout(() => {
            this.isDestinyApiEnabled = false
            this.timer = null
        }, this.timeoutDuration)
    },
    queueApiOnlineEvent: function () {
        if (this.timer) {
            clearTimeout(this.timer)
        }

        if (this.isDestinyApiEnabled) return

        this.timer = setTimeout(() => {
            this.isDestinyApiEnabled = true
            this.timer = null
        }, this.timeoutDuration)
    }
}

export const statusRoute = new RaidHubRoute({
    method: "get",
    description: "Get the status of the RaidHub Services.",
    middleware: [cacheControl(5)],
    response: {
        success: {
            statusCode: 200,
            schema: z.object({
                AtlasPGCR: z.object({
                    status: z.enum(["Crawling", "Idle", "Offline"]),
                    medianSecondsBehindNow: z.number().nullable(),
                    latestActivity: z.object({
                        dateCompleted: zISODateString(),
                        instanceId: z.string()
                    })
                })
            })
        }
    },
    async handler() {
        const [latestActivity, atlasStatus, isDestinyApiEnabled] = await Promise.all([
            getLatestActivityByDate(),
            getAtlasStatus(),
            getCommonSettings(bungiePlatformHttp).then(res => res.Response.systems.Destiny2.enabled)
        ])

        if (isDestinyApiEnabled) {
            statusState.queueApiOnlineEvent()
        } else {
            statusState.queueApiOfflineEvent()
        }

        if (!statusState.isDestinyApiEnabled) {
            return RaidHubRoute.ok({
                AtlasPGCR: {
                    status: "Idle" as const,
                    medianSecondsBehindNow: atlasStatus.lag,
                    latestActivity
                }
            })
        }

        if (!atlasStatus.isCrawling) {
            return RaidHubRoute.ok({
                AtlasPGCR: {
                    status: "Offline" as const,
                    medianSecondsBehindNow: null,
                    latestActivity
                }
            })
        }

        return RaidHubRoute.ok({
            AtlasPGCR: {
                status: "Crawling" as const,
                medianSecondsBehindNow: atlasStatus.lag,
                latestActivity
            }
        })
    }
})

const getLatestActivityByDate = async () => {
    const latestActivity = await postgres.queryRow<{
        dateCompleted: Date
        instanceId: string
    }>(
        `SELECT * FROM (
            SELECT 
                date_completed AS "dateCompleted", 
                instance_id::text AS "instanceId"
            FROM activity 
            ORDER BY instance_id DESC 
            LIMIT 50
        ) AS t1 
        ORDER BY "dateCompleted" DESC 
        LIMIT 1`
    )

    if (!latestActivity) {
        throw new Error("Postgres query failed")
    }

    return latestActivity
}
