import { test } from "bun:test"
import { manifestRoute } from "./manifest"
import { expectOk } from "./testUtil"

test("manifest 200", async () => {
    const result = await manifestRoute.$mock({})

    expectOk(result)
})
