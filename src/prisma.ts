import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient({
    log: process.env.PROD
        ? ["error"]
        : [
              {
                  level: "query",
                  emit: "event"
              },
              {
                  level: "warn",
                  emit: "stdout"
              },
              {
                  level: "error",
                  emit: "stdout"
              }
          ]
})

if (!process.env.PROD) {
    prisma.$on<"query">("query", e => {
        console.log("Query: " + e.query)
        console.log("Params: " + e.params)
        console.log("Duration: " + e.duration + "ms")
    })
}
