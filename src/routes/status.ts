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
                ActivityHistoryCrawling: z.object({
                    status: z.enum(["Crawling", "Idle", "Offline"]),
                    lag: z.number().nullable(),
                    latestActivityDate: zISODateString()
                })
            })
        }
    },
    async handler() {
        const [latestActivityDate, atlasStatus, isDestinyApiEnabled] = await Promise.all([
            getLatestActivityDate(),
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
                ActivityHistoryCrawling: {
                    status: "Idle" as const,
                    latestActivityDate: latestActivityDate.toISOString(),
                    lag: atlasStatus.lag
                }
            })
        }

        if (!atlasStatus.isCrawling) {
            return RaidHubRoute.ok({
                ActivityHistoryCrawling: {
                    status: "Offline" as const,
                    latestActivityDate: latestActivityDate.toISOString(),
                    lag: null
                }
            })
        }

        return RaidHubRoute.ok({
            ActivityHistoryCrawling: {
                status: "Crawling" as const,
                lag: atlasStatus.lag,
                latestActivityDate: latestActivityDate.toISOString()
            }
        })
    }
})

const getLatestActivityDate = async () => {
    const latestActivity = await postgres.queryRow<{
        date_completed: Date
    }>(
        `SELECT * FROM 
            (SELECT date_completed FROM activity ORDER BY instance_id DESC LIMIT 50) AS t1 
        ORDER BY date_completed 
        DESC LIMIT 1`
    )

    if (!latestActivity) {
        throw new Error("Postgres query failed")
    }

    return latestActivity.date_completed
}
