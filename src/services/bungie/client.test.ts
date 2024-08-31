import { describe, expect, test } from "bun:test"
import { getDestinyManifest, transferItem } from "bungie-net-core/endpoints/Destiny2"
import { spyOnFetch } from "../../util.test"
import { bungiePlatformHttp } from "./client"
import { BungieApiError } from "./error"

describe("bungie http client", () => {
    test("ok", async () => {
        const res = await getDestinyManifest(bungiePlatformHttp)

        expect(res.ErrorCode).toBe(1)
    })

    test("error", async () => {
        try {
            const res = await transferItem(bungiePlatformHttp, {
                itemReferenceHash: 691752909,
                stackSize: 1,
                transferToVault: true,
                itemId: "691752909",
                characterId: "2305843009265044317",
                membershipType: 3
            })
            expect(res.ErrorCode).toBe(99)
        } catch (err: any) {
            expect(err).toBeInstanceOf(BungieApiError)
            expect(err.cause.ErrorCode).toBe(99)
        }
    })

    test("html error", async () => {
        const url = new URL("https://www.bungie.net/Platform/Destiny2")
        try {
            const res = await bungiePlatformHttp.fetch({
                url: url,
                method: "POST"
            })
            expect(res).toBe(null)
        } catch (err: any) {
            expect(err).toBeInstanceOf(Error)
            expect(err.cause).toContain("html")
        }
    })
})

describe("bungie http client with mocks", () => {
    const spyFetch = spyOnFetch()

    test("json error", async () => {
        const mockResponse = new Response(JSON.stringify({ ok: true }), {
            headers: {
                "Content-Type": "application/json"
            }
        })
        spyFetch.mockResolvedValueOnce(mockResponse)

        try {
            const res = await bungiePlatformHttp.fetch({
                url: new URL("http://localhost/mocked"),
                method: "GET"
            })

            expect(res).toBe(null)
        } catch (err: any) {
            expect(err).toBeInstanceOf(Error)
            expect(err.message).toBe("Invalid JSON response")
        }
    })

    test("http error", async () => {
        const mockResponse = new Response(null, {
            status: 504,
            statusText: "Gateway Timeout"
        })
        spyFetch.mockResolvedValueOnce(mockResponse)

        try {
            const res = await bungiePlatformHttp.fetch({
                url: new URL("http://localhost/mocked"),
                method: "GET"
            })

            expect(res).toBe(null)
        } catch (err: any) {
            expect(err).toBeInstanceOf(Error)
            expect(err.message).toBe("Invalid response (504): Gateway Timeout")
        }
    })
})
