test("API Tests", async () => {
    const url = `http://localhost:8000/activity/${process.env.TEST_ACTIVITY_ID}`

    const jsonData: any = await fetch(url).then(res => res.json())

    expect(jsonData).toHaveProperty("minted")
    expect(jsonData).toHaveProperty("response")

    expect(jsonData.response).toHaveProperty("activityId")
    expect(jsonData.response).toHaveProperty("raidHash")
    expect(jsonData.response).toHaveProperty("flawless")
    expect(jsonData.response).toHaveProperty("completed")
    expect(jsonData.response).toHaveProperty("fresh")
    expect(jsonData.response).toHaveProperty("playerCount")
    expect(jsonData.response).toHaveProperty("dateStarted")
    expect(jsonData.response).toHaveProperty("dateCompleted")
    expect(jsonData.response).toHaveProperty("dayOne")
    expect(jsonData.response).toHaveProperty("contest")
    expect(jsonData.response).toHaveProperty("weekOne")
    expect(jsonData.response).toHaveProperty("players")
    expect(typeof jsonData.response.players).toBe("object")
    Object.values(jsonData.response.players).forEach(value => {
        expect(typeof value).toBe("boolean")
    })
})
