import { describe, expect, mock, test } from "bun:test"
import { PlatformErrorCodes } from "bungie-net-core/enums"
import { ErrorCode } from "../schema/errors/ErrorCode"
import { BungieApiError } from "../services/bungie/error"
import { clanStatsRoute } from "./clan"
import { expectErr, expectOk } from "./testUtil"

describe("clan 200", () => {
    const t = async (groupId: string) => {
        const result = await clanStatsRoute.$mock({ params: { groupId } })
        expectOk(result)
    }

    test("Elysium", () => t("3148408"))

    test("Passion", () => t("4999487"))
})

test("clan 404", async () => {
    const result = await clanStatsRoute.$mock({ params: { groupId: "1" } })

    expectErr(result)
    expect(result.code).toBe(ErrorCode.ClanNotFound)
})

test("clan 503", async () => {
    mock.module("bungie-net-core/endpoints/GroupV2", () => {
        return {
            getMembersOfGroup: async () => {
                throw new BungieApiError({
                    cause: {
                        Response: undefined,
                        ErrorCode: PlatformErrorCodes.SystemDisabled,
                        ThrottleSeconds: 0,
                        ErrorStatus: "",
                        Message: "System Disabled",
                        MessageData: {},
                        DetailedErrorTrace: ""
                    },
                    url: new URL("https://localhost/mocked")
                })
            }
        }
    })

    const result = await clanStatsRoute.$mock({
        params: {
            groupId: "3148408"
        }
    })

    expectErr(result)
    expect(result.code).toBe(ErrorCode.BungieServiceOffline)
})
