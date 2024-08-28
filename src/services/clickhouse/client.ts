import { createClient } from "@clickhouse/client"

export const clickhouse = createClient({
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD
})
