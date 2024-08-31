type QueryRangeResponse =
    | {
          status: "success"
          data: {
              resultType: "success"
              result?: [
                  {
                      metric: unknown
                      values: [number, string][]
                  }
              ]
          }
      }
    | {
          status: "error"
      }

const baseUrl = `http://localhost:${process.env.PROMETHEUS_HTTP_PORT ?? 9090}/api/v1/query_range?query=histogram_quantile(0.50, sum(rate(pgcr_crawl_summary_lag_bucket[2m])) by (le))`
const intervalMins = 5

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
    url.searchParams.set("step", "30s")

    const response = await fetch(url)
    const queryRangeResponse = (await response.json()) as QueryRangeResponse

    if (queryRangeResponse.status !== "success") {
        throw new Error("Prometheus query failed", {
            cause: queryRangeResponse
        })
    }

    if (!queryRangeResponse.data.result?.[0].values.length) {
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
        lag: sum / totalWeight
    }
}
