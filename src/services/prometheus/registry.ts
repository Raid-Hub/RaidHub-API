import { Registry } from "prom-client"
import { httpRequestTimer } from "./metrics"

export const prometheusRegistry = new Registry()

prometheusRegistry.registerMetric(httpRequestTimer)
