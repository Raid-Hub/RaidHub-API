import { Registry } from "prom-client"
import { activityHistoryQueryTimer, httpRequestTimer, playerProfileQueryTimer } from "./metrics"

export const prometheusRegistry = new Registry()

prometheusRegistry.registerMetric(httpRequestTimer)
prometheusRegistry.registerMetric(activityHistoryQueryTimer)
prometheusRegistry.registerMetric(playerProfileQueryTimer)
