import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi"
import { exec } from "child_process"
import { writeFile } from "fs"
import { router } from "../src/routes"
import { registry } from "../src/schema/common"

const dir = "./open-api"
const fileName = dir + "/openapi.json"

console.log("Generating OpenAPI spec...")

router.openApiRoutes().forEach(route => {
    const jsonRes = route.responses[200].content?.["application/json"]
    if (jsonRes && "openapi" in jsonRes.schema) {
        // update the schema to use the registered schema
        const refId =
            route.path
                .replace(/\/{[^/]+}/g, "")
                .split("/")
                .filter(Boolean)
                .map(str => str.charAt(0).toUpperCase() + str.slice(1))
                .join("") + "Response"
        jsonRes.schema = registry.register(refId, jsonRes.schema)
    }
    registry.registerPath(route)
})

const doc = new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: "3.0.0",
    info: {
        title: "RaidHub API",
        description: "The Semi-public API for RaidHub",
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
        exec(`redoc-cli bundle -o ${dir}/index.html ${fileName} --options='${redocOpts}'`, err => {
            if (err) {
                console.error(err)
                process.exit(1)
            }
            console.log("Done.")
        })
    })
})

const redocOpts = JSON.stringify({})
