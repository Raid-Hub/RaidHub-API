import express from "express"
import request from "supertest"
import { z } from "zod"
import { RaidHubRoute } from "../RaidHubRoute"
import { errorHandler } from "../middlewares/errorHandler"
import { zDigitString } from "../schema/zod"
import { ok } from "../util/response"

const app = express()

app.use(express.json())

const testGetRoute = new RaidHubRoute({
    method: "get",
    params: z
        .object({
            testId: zDigitString()
        })
        .strict(),
    query: z
        .object({
            hello: z.string().optional(),
            count: z.coerce.number()
        })
        .strict(),
    handler: async () => {
        return ok({
            woo: "hoo"
        })
    },
    response: {
        success: z
            .object({
                woo: z.string()
            })
            .strict()
    }
})

const testPostRoute = new RaidHubRoute({
    method: "post",
    body: z.object({
        hello: z.string().optional(),
        count: z.coerce.number()
    }),
    query: z
        .object({
            id: z.string().optional()
        })
        .strict(),
    handler: async args => {
        return ok({
            posted: { ...args.query, ...args.body, data: { value: "destiny 2" } }
        })
    },
    response: {
        success: z
            .object({
                posted: z.object({
                    id: z.string().optional(),
                    hello: z.string().optional()
                })
            })
            .strict()
    }
})

app.use("/test/post", testPostRoute.express)
app.use("/test/:testId", testGetRoute.express)

app.use(errorHandler)

describe("raidhub route middleware validators", () => {
    test("body is right shape", async () => {
        const res = await request(app).get("/test/123").query({ hello: "world" })
        expect(res.body).toHaveProperty("error")
        expect(res.body).toHaveProperty("minted")
        const minted = new Date(res.body.minted).getTime()
        expect(minted).toBeLessThanOrEqual(Date.now())
        expect(minted).toBeGreaterThanOrEqual(Date.now() - 5000)
        expect(res.body.success).toBe(false)
    })

    test("fails query parsing", async () => {
        const res = await request(app).get("/test/123").query({ hello: "world", yolo: 2 })
        expect(res.body.message).toBe("Invalid query params")
        expect(res.body.error).toHaveProperty("issues")
        expect(res.body.error.issues).toHaveProperty("0")
        expect(res.body.error.issues[0].path).toEqual(["count"])
        expect(res.body.error.issues).toHaveProperty("1")
        expect(res.body.error.issues[1].keys).toEqual(["yolo"])
        expect(res.status).toBe(400)
    })

    test("fails params parsing", async () => {
        const res = await request(app).get("/test/abc").query({ count: 5, hello: "sup" })
        expect(res.body.message).toBe("Invalid path params")
        expect(res.body.error).toHaveProperty("issues")
        expect(res.body.error.issues).toHaveProperty("0")
        expect(res.body.error.issues[0].path).toEqual(["testId"])
        expect(res.status).toBe(404)
    })

    test("fails body parsing", async () => {
        const res = await request(app)
            .post("/test/post")
            .query({ id: "124" })
            .send(
                JSON.stringify({
                    hello: "world",
                    data: {
                        value: 2812
                    }
                })
            )
        expect(res.body.message).toBe("Invalid JSON body")
        expect(res.body.error).toHaveProperty("issues")
        expect(res.body.error.issues).toHaveProperty("0")
        expect(res.body.error.issues[0].path).toEqual(["count"])
    })

    test("passes parsing get", async () => {
        const res = await request(app).get("/test/123").query({ count: 10 })
        expect(res.body).toMatchObject({
            success: true,
            response: {
                woo: "hoo"
            }
        })
        expect(res.status).toBe(200)
    })

    test("passes parsing post", async () => {
        const res = await request(app)
            .post("/test/post")
            .query({ id: "hyfasfaa" })
            .send({
                hello: "world",
                count: "2",
                data: {
                    value: 2812
                }
            })

        expect(res.body).toMatchObject({
            success: true,
            response: {
                posted: {
                    id: "hyfasfaa",
                    hello: "world",
                    data: {
                        value: "destiny 2"
                    }
                }
            }
        })
        expect(res.status).toBe(200)
    })
})
