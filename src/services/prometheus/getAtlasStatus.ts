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
const intervalMins = 2

export const getAtlasStatus = async (): Promise<
    | {
          isCrawling: true
          lag: number
      }
    | {
          isCrawling: false
          lag: null
      }
> => {
    const url = new URL(baseUrl)
    url.searchParams.set("start", new Date(Date.now() - intervalMins * 60000).toISOString())
    url.searchParams.set("end", new Date().toISOString())
    url.searchParams.set("step", "15s")

    const response = await fetch(url)
    const queryRangeResponse = (await response.json()) as QueryRangeResponse

    if (!queryRangeResponse.data?.result?.[0]?.values.length) {
        return { isCrawling: false, lag: null }
    }

    const { totalWeight, sum } = queryRangeResponse.data.result[0].values.reduce<{
        totalWeight: number
        sum: number
    }>(
        (acc, [, value], idx) => ({
            totalWeight: acc.totalWeight + (idx + 1),
            sum: acc.sum + Number(value) * (idx + 1)
        }),
        {
            totalWeight: 0,
            sum: 0
        }
    )

    return {
        isCrawling: true,
        lag: Math.round((1000 * sum) / totalWeight) / 1000
    }
}
