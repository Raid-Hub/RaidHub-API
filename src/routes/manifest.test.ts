import { manifestRoute } from "./manifest"
import { cleanupPostgresAfterAll, expectOk } from "./testUtil"

cleanupPostgresAfterAll()

test("manifest 200", async () => {
    const result = await manifestRoute.$mock({})

    expectOk(result)
})
