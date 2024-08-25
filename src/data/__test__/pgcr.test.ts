import { describe, expect, it } from "bun:test"
import { z } from "zod"
import { getRawCompressedPGCR } from "../pgcr"

describe("getRawCompressedPGCR", () => {
    it("returns the correct shape", async () => {
        const data = await getRawCompressedPGCR("12685770593").catch(console.error)

        const parsed = z
            .object({
                data: z.object({})
            })
            .strict()
            .safeParse(data)
        if (!parsed.success) {
            expect(parsed.error.errors).toHaveLength(0)
        } else {
            expect(parsed.success).toBe(true)
        }
    })
})
