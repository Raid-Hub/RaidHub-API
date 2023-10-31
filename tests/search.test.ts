const [displayName, displayNameCode] = process.env.TEST_SEARCH_NAME!.split("#")

test("search by displayName", async () => {
    const url = `http://localhost:8000/search?query=${displayName}`

    const jsonData: any = await fetch(url).then(res => res.json())

    expect(jsonData).toHaveProperty("minted")
    expect(jsonData).toHaveProperty("response")

    expect(jsonData.response).toHaveProperty("params")
    expect(jsonData.response.params).toHaveProperty("count")
    expect(jsonData.response.params).toHaveProperty("term")
    expect(jsonData.response.params.term).toHaveProperty("displayName")

    expect(jsonData.response).toHaveProperty("results")
    expect(jsonData.response.results.length).toBeGreaterThanOrEqual(1)
    jsonData.response.results.forEach((result: any) => {
        expect(result).toHaveProperty("bungieGlobalDisplayName")
        expect(result).toHaveProperty("bungieGlobalDisplayNameCode")
        expect(result).toHaveProperty("clears")
        expect(result).toHaveProperty("displayName")
        expect(result).toHaveProperty("iconPath")
        expect(result).toHaveProperty("lastSeen")
        expect(result).toHaveProperty("membershipId")
        expect(result).toHaveProperty("membershipType")
    })
})

test("search by bungie name", async () => {
    const q = encodeURIComponent(displayName + "#" + displayNameCode)
    const url = `http://localhost:8000/search?query=${q}`

    const jsonData: any = await fetch(url).then(res => res.json())

    expect(jsonData).toHaveProperty("minted")
    expect(jsonData).toHaveProperty("response")

    expect(jsonData.response).toHaveProperty("params")
    expect(jsonData.response.params).toHaveProperty("count")
    expect(jsonData.response.params).toHaveProperty("term")
    expect(jsonData.response.params.term).toHaveProperty("bungieGlobalDisplayName")
    expect(jsonData.response.params.term).toHaveProperty("bungieGlobalDisplayNameCode")

    expect(jsonData.response).toHaveProperty("results")
    expect(jsonData.response.results.length).toBeGreaterThanOrEqual(1)
    jsonData.response.results.forEach((result: any) => {
        expect(result).toHaveProperty("bungieGlobalDisplayName")
        expect(result).toHaveProperty("bungieGlobalDisplayNameCode")
        expect(result).toHaveProperty("clears")
        expect(result).toHaveProperty("displayName")
        expect(result).toHaveProperty("iconPath")
        expect(result).toHaveProperty("lastSeen")
        expect(result).toHaveProperty("membershipId")
        expect(result).toHaveProperty("membershipType")
    })
})
