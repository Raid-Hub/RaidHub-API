import { z } from "zod"
import { cleanupPostgresAfterAll } from "../../routes/testUtil"
import { zInstance } from "../../schema/components/Instance"
import { zInstanceExtended } from "../../schema/components/InstanceExtended"
import { zInstanceMetadata } from "../../schema/components/InstanceMetadata"
import {
    getInstance,
    getInstanceExtended,
    getInstanceMetadataByHash,
    getLeaderboardEntryForInstance
} from "../instance"

cleanupPostgresAfterAll()

describe("getInstance", () => {
    it("returns the correct shape", async () => {
        const data = await getInstance("12685770593").catch(console.error)

        const parsed = zInstance.safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.success).toBe(true)
        }
    })
})

describe("getInstanceExtended", () => {
    it("returns the correct shape", async () => {
        const data = await getInstanceExtended("12685770593").catch(console.error)

        const parsed = zInstanceExtended.safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.success).toBe(true)
        }
    })
})

describe("getInstanceMetadataByHash", () => {
    it("returns the correct shape", async () => {
        const data = await getInstanceMetadataByHash("3711931140").catch(console.error)

        const parsed = zInstanceMetadata.safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.success).toBe(true)
        }
    })
})

describe("getLeaderboardEntryForInstance", () => {
    it("returns the correct shape", async () => {
        const data = await getLeaderboardEntryForInstance("13779269605").catch(console.error)

        const parsed = z
            .object({
                rank: z.literal(14)
            })
            .safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.success).toBe(true)
        }
    })
})
