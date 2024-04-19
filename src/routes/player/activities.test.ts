import express from "express"
import request from "supertest"
import { playerActivitiesRoute } from "./activities"

describe("player activities 200", () => {
    const t = async (membershipId: string, cursor?: string) => {
        const result = await playerActivitiesRoute.$mock({
            params: { membershipId },
            query: { cursor }
        })
        expect(result.type).toBe("ok")
        return result
    }

    test("4611686018488107374", () => t("4611686018488107374"))

    test("4611686018467831285", () => t("4611686018467831285"))

    test("year cursor", () => t("4611686018501336567"))

    test("end of list", () =>
        t("4611686018488107374", "1").then(result => {
            expect(result.parsed.activities.length).toBeFalsy()
        }))

    test("final raid", () =>
        t("4611686018488107374", "4153035974").then(result => {
            expect(result.parsed.activities.length).toBe(3)
        }))
})

describe("player activities 404", () => {
    const t = async (membershipId: string) => {
        const result = await playerActivitiesRoute.$mock({
            params: {
                membershipId
            },
            query: {}
        })

        expect(result.type).toBe("err")
    }

    test("1", () => t("1"))

    test("4711686018488107374", () => t("4711686018488107374"))
})

// @ts-expect-error BigInt override
BigInt.prototype.toJSON = function () {
    return this.toString()
}

const app = express()

app.use(express.json())

app.use("/test/:membershipId", playerActivitiesRoute.express)

describe("activities middleware test", () => {
    test("1 day cache on 200 cursor query", async () => {
        const res = await request(app)
            .get("/test/4611686018488107374")
            .query({ cursor: "14324460394" })

        expect(res.status).toBe(200)
        expect(res.headers).toMatchObject({
            "cache-control": "max-age=86400"
        })
    })

    test("30s cache on 200", async () => {
        const res = await request(app).get("/test/4611686018488107374")

        expect(res.status).toBe(200)
        expect(res.headers).toMatchObject({
            "cache-control": "max-age=30"
        })
    })

    test("no cache on error", async () => {
        const res = await request(app).get("/test/3611686018488107374")

        expect(res.status).toBe(404)
        expect(res.headers["cache-control"]).toBeUndefined()
    })
})
