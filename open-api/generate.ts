import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi"
import { exec } from "child_process"
import { writeFile } from "fs"
import { router } from "../src/routes"

const dir = "./open-api"
const fileName = dir + "/openapi.json"

console.log("Generating OpenAPI spec...")
const registry = new OpenAPIRegistry()

router.openApiRoutes().forEach(route => {
    registry.registerPath(route)
})

const doc = new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: "3.0.0",
    info: {
        title: "RaidHub API",
        description: "Semi-public API for RaidHub",
        version: "0.0.0"
    },
    servers: [{ url: "https://api.raidhub.io" }]
})

console.log("Writing OpenAPI docs...")
writeFile("open-api/openapi.json", JSON.stringify(doc, null, 2), err => {
    if (err) {
        console.error(err)
        process.exit(1)
    }
    console.log("Formatting OpenAPI docs...")
    exec(`prettier --write ${fileName}`, err => {
        if (err) {
            console.error(err)
            process.exit(1)
        }

        console.log("Generating static HTML docs...")
        exec(`redoc-cli bundle -o ${dir}/docs.html ${fileName} --options='${redocOpts}'`, err => {
            if (err) {
                console.error(err)
                process.exit(1)
            }
            console.log("Done.")
        })
    })
})

const redocOpts = JSON.stringify({})
