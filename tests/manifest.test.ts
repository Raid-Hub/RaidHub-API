test("manifest tests", async () => {
    const url = `http://localhost:8000/manifest`

    const jsonData: any = await fetch(url).then(res => res.json())

    expect(jsonData).toHaveProperty("minted")
    expect(jsonData).toHaveProperty("response")

    expect(jsonData.response).toHaveProperty("raids")
    Object.values(jsonData.response.raids).forEach(value => {
        expect(typeof value).toBe("string")
    })
    expect(jsonData.response).toHaveProperty("difficulties")
    expect(jsonData.response).toHaveProperty("hashes")
    Object.values(jsonData.response.hashes).forEach(value => {
        expect(value).toHaveProperty("raid")
        expect(value).toHaveProperty("difficulty")
    })
    expect(jsonData.response).toHaveProperty("listed")
    expect(jsonData.response).toHaveProperty("sunset")
    expect(jsonData.response).toHaveProperty("contest")
    expect(jsonData.response).toHaveProperty("master")
    expect(jsonData.response).toHaveProperty("prestige")
    expect(jsonData.response).toHaveProperty("reprisedChallengePairings")
    Object.values(jsonData.response.reprisedChallengePairings).forEach(value => {
        expect(value).toHaveProperty("raid")
        expect(value).toHaveProperty("difficulty")
    })
    expect(jsonData.response).toHaveProperty("activityLeaderboards")
    expect(jsonData.response).toHaveProperty("worldFirstBoards")
    Object.values(jsonData.response.worldFirstBoards).forEach(value => {
        expect(value).toMatch(/\b(normal|challenge)\b/)
    })
})
