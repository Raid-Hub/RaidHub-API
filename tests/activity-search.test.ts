test("API Tests", async () => {
    const url = new URL(
        `http://localhost:8000/activities/search?membershipId=${process.env.TEST_MEMBERSHIP_ID}`
    )
    url.searchParams.append("minPlayers", "1")
    url.searchParams.append("maxPlayers", "6")
    url.searchParams.append("page", "1")
    url.searchParams.append("raid", "12")
    url.searchParams.append("flawless", "false")
    url.searchParams.append("minSeason", "1")
    url.searchParams.append("maxSeason", "22")
    url.searchParams.append("minDate", new Date(0).toISOString())
    url.searchParams.append("maxDate", new Date().toISOString())

    const jsonData: any = await fetch(url).then(res => res.json())

    expect(jsonData).toHaveProperty("minted")
    expect(jsonData).toHaveProperty("response")

    expect(jsonData.response).toHaveProperty("query")

    expect(jsonData.response).toHaveProperty("results")
    expect(jsonData.response.results.length).toBeGreaterThan(0)
    jsonData.response.results.forEach((result: any) => {
        expect(result).toHaveProperty("instanceId")
        expect(result).toHaveProperty("raidHash")
        expect(result).toHaveProperty("fresh")
        expect(result).toHaveProperty("completed")
        expect(result).toHaveProperty("playerCount")
        expect(result).toHaveProperty("dateStarted")
        expect(result).toHaveProperty("dateCompleted")
        expect(result).toHaveProperty("platformType")
        expect(result).toHaveProperty("dayOne")
        expect(result).toHaveProperty("contest")
    })
})
