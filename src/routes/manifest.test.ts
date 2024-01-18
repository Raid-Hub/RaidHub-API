import { manifestRoute } from "./manifest"

test("manifest 200", async () => {
    const result = await manifestRoute.mock({})

    expect(result.type).toBe("ok")
})
