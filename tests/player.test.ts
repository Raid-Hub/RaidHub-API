test("API Tests", async () => {
    const url = `http://localhost:8000/player/${process.env.TEST_MEMBERSHIP_ID}`

    const jsonData: any = await fetch(url).then(res => res.json())

    expect(jsonData).toHaveProperty("minted")
    expect(jsonData).toHaveProperty("response")

    expect(jsonData.response).toHaveProperty("activityLeaderboardEntries")
    const values = Object.values(jsonData.response.activityLeaderboardEntries) as any[][]
    expect(values.length).toBeGreaterThan(0)
    values.forEach(board => {
        expect(board.length).toBeGreaterThan(0)
        board.forEach(entry => {
            expect(entry).toHaveProperty("rank")
            expect(entry).toHaveProperty("instanceId")
            expect(entry).toHaveProperty("raidHash")
            expect(entry).toHaveProperty("dayOne")
            expect(entry).toHaveProperty("contest")
            expect(entry).toHaveProperty("weekOne")
        })
    })
    expect(jsonData.response).toHaveProperty("player")
    expect(jsonData.response.player).toHaveProperty("bungieGlobalDisplayName")
    expect(jsonData.response.player).toHaveProperty("bungieGlobalDisplayNameCode")
    expect(jsonData.response.player).toHaveProperty("clears")
    expect(jsonData.response.player).toHaveProperty("displayName")
    expect(jsonData.response.player).toHaveProperty("iconPath")
    expect(jsonData.response.player).toHaveProperty("lastSeen")
    expect(jsonData.response.player).toHaveProperty("membershipId")
    expect(jsonData.response.player).toHaveProperty("membershipType")
})
