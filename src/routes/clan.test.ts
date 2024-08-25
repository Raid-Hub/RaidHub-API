import { describe, expect, spyOn, test } from "bun:test"
import { PlatformErrorCodes } from "bungie-net-core/enums"
import { ErrorCode } from "../schema/errors/ErrorCode"
import { bungiePlatformHttp } from "../services/bungie/client"
import { BungieApiError } from "../services/bungie/error"
import { expectErr, expectOk } from "../util.test"
import { clanStatsRoute } from "./clan"

describe("clan 200", () => {
    const t = async (groupId: string) => {
        const result = await clanStatsRoute.$mock({ params: { groupId } })
        expectOk(result)
    }

    test("Elysium", () => t("3148408"))

    test("Passion", () => t("4999487"))
})

describe("clan 404", () => {
    test("not a clan", async () => {
        const result = await clanStatsRoute.$mock({ params: { groupId: "1" } })

        expectErr(result)
        expect(result.code).toBe(ErrorCode.ClanNotFound)
    })

    test("not found", async () => {
        const result = await clanStatsRoute.$mock({ params: { groupId: "9999999999999" } })

        expectErr(result)
        expect(result.code).toBe(ErrorCode.ClanNotFound)
    })
})

test("clan 503", async () => {
    spyOn(bungiePlatformHttp, "fetch").mockRejectedValueOnce(
        new BungieApiError({
            cause: {
                ErrorCode: PlatformErrorCodes.SystemDisabled,
                Message: "System Disabled",
                ThrottleSeconds: 0,
                Response: undefined,
                ErrorStatus: "",
                MessageData: {},
                DetailedErrorTrace: ""
            },
            url: new URL("http://localhost/mocked")
        })
    )

    const result = await clanStatsRoute.$mock({
        params: {
            groupId: "3148408"
        }
    })

    expectErr(result)
    expect(result.code).toBe(ErrorCode.BungieServiceOffline)
})
