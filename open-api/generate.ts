import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi"
import { exec } from "child_process"
import { writeFile } from "fs"
import { router } from "../src/routes"

writeFile("open-api/openapi.json", JSON.stringify(genOpenAPIDoc(), null, 2), () =>
    exec("prettier --write ./open-api/openapi.json", () => {
        console.log("Done.")
    })
)

function genOpenAPIDoc() {
    const registry = new OpenAPIRegistry()

    router.openApiRoutes().forEach(route => {
        registry.registerPath(route)
    })

    return new OpenApiGeneratorV3(registry.definitions).generateDocument({
        openapi: "3.0.0",
        info: {
            title: "RaidHub API",
            description: "Semi-public API for RaidHub",
            version: "0.0.0"
        },
        servers: [{ url: "https://api.raidhub.io" }]
    })
}
