import { z } from "zod"
import { cleanupPostgresAfterAll } from "../../routes/testUtil"
import { zPlayerInfo } from "../../schema/components/PlayerInfo"
import {
    zPlayerProfile,
    zPlayerProfileActivityStats,
    zPlayerProfileGlobalStats,
    zWorldFirstEntry
} from "../../schema/components/PlayerProfile"
import { zBigIntString } from "../../schema/util"
import {
    getPlayer,
    getPlayerActivityStats,
    getPlayerGlobalStats,
    getProfile,
    getWorldFirstEntries
} from "../player"

cleanupPostgresAfterAll()

describe("getPlayer", () => {
    it("returns the correct shape", async () => {
        const data = await getPlayer("4611686018488107374").catch(console.error)

        const parsed = zPlayerInfo.safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.success).toBe(true)
        }
    })
})

describe("getPlayerActivityStats", () => {
    it("returns the correct shape", async () => {
        const data = await getPlayerActivityStats("4611686018488107374").catch(console.error)

        const parsed = z.array(zPlayerProfileActivityStats).safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.data.length).toBeGreaterThan(0)
            expect(parsed.success).toBe(true)
        }
    })
})

describe("getPlayerGlobalStats", () => {
    it("returns the correct shape", async () => {
        const data = await getPlayerGlobalStats("4611686018488107374").catch(console.error)

        const parsed = zPlayerProfileGlobalStats.safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.success).toBe(true)
        }
    })
})

describe("getWorldFirstEntries", () => {
    it("returns the correct shape", async () => {
        const data = await getWorldFirstEntries("4611686018488107374").catch(console.error)

        const parsed = z
            .array(
                zWorldFirstEntry.or(
                    z.object({
                        activityId: zBigIntString(),
                        rank: z.null(),
                        instanceId: z.null(),
                        timeAfterLaunch: z.null()
                    })
                )
            )
            .safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.data.length).toBeGreaterThan(0)
            expect(parsed.success).toBe(true)
        }
    })
})

describe("getProfile", () => {
    it("returns the correct shape", async () => {
        const data = await getProfile("4611686018488107374").catch(console.error)

        const parsed = zPlayerProfile.safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.success).toBe(true)
        }
    })
})
