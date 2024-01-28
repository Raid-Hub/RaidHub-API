import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
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
        success: {
            statusCode: 200,
            schema: z
                .object({
                    woo: z.string()
                })
                .strict()
        }
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
        success: {
            statusCode: 200,
            schema: z
                .object({
                    posted: z.object({
                        id: z.string().optional(),
                        hello: z.string().optional()
                    })
                })
                .strict()
        }
    }
})

const testEmptyRoute = new RaidHubRoute({
    method: "get",
    handler: async () => {
        return ok({
            game: "destiny 2" as const
        })
    },
    response: {
        success: {
            statusCode: 200,
            schema: z.object({
                game: z.literal("destiny 2")
            })
        }
    }
})

const testFailRoute = new RaidHubRoute({
    method: "get",
    query: z.object({
        fail: z.string().optional()
    }),
    handler: async args => {
        if (args.query.fail === "d2") {
            throw new Error("bad game")
        } else if (args.query.fail === "prisma") {
            throw new PrismaClientKnownRequestError(
                "Invalid `prisma.player.findUnique()` invocation in...",
                {
                    code: "P2002",
                    meta: {
                        target: "user"
                    },
                    clientVersion: "0.0.0"
                }
            )
        }
        return ok({
            game: "destiny 2" as const
        })
    },
    response: {
        success: {
            statusCode: 200,
            schema: z.object({
                game: z.literal("destiny 2")
            })
        }
    }
})

app.use("/test/", testEmptyRoute.express)
app.use("/test/post", testPostRoute.express)
app.use("/test/fail", testFailRoute.express)
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

    test("passes parsing empty", async () => {
        const res = await request(app).get("/test")
        expect(res.body).toMatchObject({
            success: true,
            response: {
                game: "destiny 2"
            }
        })
        expect(res.status).toBe(200)
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

describe("raidhub route unhandled error", () => {
    test("unhandled error thrown ", async () => {
        const res = await request(app).get("/test/fail").query({ fail: "d2" })

        expect(res.body.message).toBe("Something went wrong.")
    })

    test("prisma unhandled error thrown ", async () => {
        const res = await request(app).get("/test/fail").query({ fail: "prisma" })

        expect(res.body.error).toMatchObject({
            type: "PrismaClientKnownRequestError",
            at: "prisma.player.findUnique()"
        })
    })

    test("no error thrown ", async () => {
        const res = await request(app).get("/test/fail")

        expect(res.body.response).toMatchObject({
            game: "destiny 2"
        })
    })
})
