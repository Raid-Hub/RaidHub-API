import { BungieNetResponse, DestinyPostGameCarnageReportData } from "bungie-net-core/models"

test("API Tests", async () => {
    const url = `http://localhost:8000/pgcr/${process.env.TEST_ACTIVITY_ID}`

    const jsonData: any = await fetch(url).then(res => res.json())

    const bungieData = await fetch(
        `https://stats.bungie.net/Platform/Destiny2/Stats/PostGameCarnageReport/${process.env.TEST_ACTIVITY_ID}/`,
        {
            headers: {
                "x-api-key": process.env.DEV_BUNGIE_API_KEY!
            }
        }
    ).then(res => res.json() as Promise<BungieNetResponse<DestinyPostGameCarnageReportData>>)

    expect(jsonData).toHaveProperty("minted")
    expect(jsonData).toHaveProperty("response")

    const jsonDataString = JSON.stringify(jsonData.response)
    const bungieDataString = JSON.stringify(bungieData.Response)

    expect(jsonDataString).toEqual(bungieDataString)
})
