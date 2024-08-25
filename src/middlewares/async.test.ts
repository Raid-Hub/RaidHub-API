import { beforeAll, beforeEach, describe, expect, spyOn, test } from "bun:test"
import express from "express"
import request from "supertest"
import { clanQueue } from "../services/rabbitmq/queues/clan"
import { playersQueue } from "../services/rabbitmq/queues/player"
import { processClanAsync } from "./processClanAsync"
import { processPlayerAsync } from "./processPlayerAsync"

const app = express()

describe("player", () => {
    beforeAll(() => {
        app.use("/player/200/:membershipId", processPlayerAsync, (req, res) => {
            req.params.membershipId = BigInt(req.params.membershipId)
            res.sendStatus(200)
        })

        app.use("/player/404/:membershipId", processPlayerAsync, (req, res) => {
            req.params.membershipId = BigInt(req.params.membershipId)
            res.sendStatus(404)
        })
    })

    const spyPlayersQueueSend = spyOn(playersQueue, "send")
    beforeEach(() => {
        spyPlayersQueueSend.mockReset()
        spyPlayersQueueSend.mockResolvedValueOnce(true)
    })

    test("sends on 200", async () => {
        const res = await request(app).get("/player/200/4611686018488107374")
        expect(res.status).toBe(200)

        expect(spyPlayersQueueSend).toHaveBeenCalledTimes(1)
        expect(spyPlayersQueueSend).toHaveBeenCalledWith({ membershipId: 4611686018488107374n })
    })

    test("sends on 404", async () => {
        const res = await request(app).get("/player/404/4611686018488107374")
        expect(res.status).toBe(404)

        expect(spyPlayersQueueSend).toHaveBeenCalledTimes(1)
        expect(spyPlayersQueueSend).toHaveBeenCalledWith({ membershipId: 4611686018488107374n })
    })
})

describe("clan", () => {
    beforeAll(() => {
        app.use("/clan/200/:groupId", processClanAsync, (req, res) => {
            req.params.groupId = BigInt(req.params.groupId)
            res.sendStatus(200)
        })

        app.use("/clan/404/:groupId", processClanAsync, (req, res) => {
            req.params.groupId = BigInt(req.params.groupId)
            res.sendStatus(404)
        })
    })

    const spyClanQueueSend = spyOn(clanQueue, "send")
    beforeEach(() => {
        spyClanQueueSend.mockReset()
        spyClanQueueSend.mockResolvedValueOnce(true)
    })

    test("sends on 200", async () => {
        const res = await request(app).get("/clan/200/3148408")
        expect(res.status).toBe(200)

        expect(spyClanQueueSend).toHaveBeenCalledTimes(1)
        expect(spyClanQueueSend).toHaveBeenCalledWith({ groupId: 3148408n })
    })

    test("does not send on 404", async () => {
        const res = await request(app).get("/clan/404/3148408")
        expect(res.status).toBe(404)

        expect(spyClanQueueSend).not.toHaveBeenCalled()
    })
})
