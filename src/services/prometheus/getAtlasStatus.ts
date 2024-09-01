type QueryRangeResponse = {
    status: "success"
    data: {
        result?: [
            {
                metric: unknown
                values: [number, string][]
            }
        ]
    }
}

const baseUrl = `http://localhost:${process.env.PROMETHEUS_HTTP_PORT ?? 9090}/api/v1/query_range?query=histogram_quantile(0.50, sum(rate(pgcr_crawl_summary_lag_bucket[2m])) by (le))&?query=histogram_quantile(0.25, sum(rate(pgcr_crawl_summary_lag_bucket[2m])) by (le))`
const intervalMins = 5

export const getAtlasStatus = async (): Promise<
    | {
          isCrawling: true
          lag: number
          estimatedCatchUpTime: number
      }
    | {
          isCrawling: false
          lag: null
      }
> => {
    const start = Date.now()
    const url = new URL(baseUrl)
    url.searchParams.set("start", new Date(start - intervalMins * 60000).toISOString())
    url.searchParams.set("end", new Date(start).toISOString())
    url.searchParams.set("step", "15s")

    const response = await fetch(url)
    const queryRangeResponse = (await response.json()) as QueryRangeResponse

    if (!queryRangeResponse.data?.result?.[0]?.values.length) {
        return { isCrawling: false, lag: null }
    }

    const values = queryRangeResponse.data.result[0].values

    const mostRecentTimestamp = values[values.length - 1][0]
    const skew = start - 1000 * mostRecentTimestamp

    if (skew >= 30000) {
        return { isCrawling: false, lag: null }
    }

    // Calculate the weighted average of the lag values
    const { totalWeight, sum } = values.slice(-6).reduce<{
        totalWeight: number
        sum: number
    }>(
        (acc, [, lag], idx) => ({
            totalWeight: acc.totalWeight + (idx + 1),
            sum: acc.sum + Number(lag) * (idx + 1)
        }),
        {
            totalWeight: 0,
            sum: 0
        }
    )
    const weightedLag = sum / totalWeight

    if (weightedLag < 60) {
        return {
            isCrawling: true,
            lag: weightedLag,
            estimatedCatchUpTime: 0
        }
    }

    // Get the rate of change of the increase in lag over the last 5 minutes using 3 points
    const oldest = values[0]
    const middle = values[Math.floor(values.length / 2)]
    const newest = values[values.length - 1]

    // Measured in seconds per second
    const rateA = (Number(middle[1]) - Number(newest[1])) / (middle[0] - newest[0])
    const rateB = (Number(oldest[1]) - Number(middle[1])) / (oldest[0] - middle[0])

    // Calculate the weighted average of the rates, seconds per second
    const weightedRate = (2 * rateA + rateB) / 3

    if (weightedRate > 0) {
        return {
            isCrawling: true,
            lag: weightedLag,
            estimatedCatchUpTime: -1
        }
    }

    // The crawler is at least 30 seconds behind, so 30s marks being caught up
    const estimatedCatchUpTime = (weightedLag - 30) / (-weightedRate + 1)

    return {
        isCrawling: true,
        lag: weightedLag,
        estimatedCatchUpTime
    }
}
