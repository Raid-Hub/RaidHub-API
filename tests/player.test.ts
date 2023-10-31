test("API Tests", async () => {
    const url = `http://localhost:8000/player/${process.env.TEST_MEMBERSHIP_ID}`

    const jsonData: any = await fetch(url).then(res => res.json())

    expect(jsonData).toHaveProperty("minted")
    expect(jsonData).toHaveProperty("response")

    expect(jsonData.response).toHaveProperty("activityLeaderboardEntries")
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
