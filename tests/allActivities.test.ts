test("Get all Activities", async () => {
    let cursor: string | null = null

    await send()
    async function send() {
        let url = `http://localhost:8000/activities/${process.env.TEST_MEMBERSHIP_ID}`
        url += cursor ? `?cursor=${cursor}` : ""

        const jsonData: any = await fetch(url).then(res => res.json())

        expect(jsonData).toHaveProperty("minted")
        expect(jsonData).toHaveProperty("response")
        expect(jsonData.response).toHaveProperty("nextCursor")
        expect(jsonData.response).toHaveProperty("activities")

        if (!cursor) {
            expect(jsonData.response.activities.length).toBeGreaterThan(3)
        }

        if (jsonData.response.activities.length) {
            expect(jsonData.response.activities[0]).toHaveProperty("activityId")
            expect(jsonData.response.activities[0]).toHaveProperty("raidHash")
            expect(jsonData.response.activities[0]).toHaveProperty("flawless")
            expect(jsonData.response.activities[0]).toHaveProperty("completed")
            expect(jsonData.response.activities[0]).toHaveProperty("fresh")
            expect(jsonData.response.activities[0]).toHaveProperty("playerCount")
            expect(jsonData.response.activities[0]).toHaveProperty("dateStarted")
            expect(jsonData.response.activities[0]).toHaveProperty("dateCompleted")
            expect(jsonData.response.activities[0]).toHaveProperty("dayOne")
            expect(jsonData.response.activities[0]).toHaveProperty("contest")
            expect(jsonData.response.activities[0]).toHaveProperty("didMemberComplete")
        }

        cursor = jsonData.response.nextCursor
        if (cursor) await send()
    }
})

test("Get first page of activities", async () => {
    const url = `http://localhost:8000/activities/${process.env.TEST_MEMBERSHIP_ID}`

    const jsonData: any = await fetch(url).then(res => res.json())

    expect(jsonData).toHaveProperty("minted")
    expect(jsonData).toHaveProperty("response")
    expect(jsonData.response).toHaveProperty("nextCursor")
    expect(jsonData.response).toHaveProperty("activities")

    expect(jsonData.response.activities.length).toBeGreaterThan(3)

    if (jsonData.response.activities.length) {
        expect(jsonData.response.activities[0]).toHaveProperty("activityId")
        expect(jsonData.response.activities[0]).toHaveProperty("raidHash")
        expect(jsonData.response.activities[0]).toHaveProperty("flawless")
        expect(jsonData.response.activities[0]).toHaveProperty("completed")
        expect(jsonData.response.activities[0]).toHaveProperty("fresh")
        expect(jsonData.response.activities[0]).toHaveProperty("playerCount")
        expect(jsonData.response.activities[0]).toHaveProperty("dateStarted")
        expect(jsonData.response.activities[0]).toHaveProperty("dateCompleted")
        expect(jsonData.response.activities[0]).toHaveProperty("dayOne")
        expect(jsonData.response.activities[0]).toHaveProperty("contest")
        expect(jsonData.response.activities[0]).toHaveProperty("didMemberComplete")
    }
})
