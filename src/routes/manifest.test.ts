import { test } from "bun:test"
import { expectOk } from "../util.test"
import { manifestRoute } from "./manifest"

test("manifest 200", async () => {
    const result = await manifestRoute.$mock({})

    expectOk(result)
})
