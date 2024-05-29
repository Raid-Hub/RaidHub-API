import { Pool, PoolConfiguration, QueryOptions } from "postgresql-client"

class RaidHubPool extends Pool {
    constructor(config?: PoolConfiguration | string) {
        super(config)
    }

    async queryRow<T>(sql: string, options?: QueryOptions): Promise<T | null> {
        const { rows, fields, executeTime } = await this.query(sql, options)
        if (!process.env.PROD && !process.env.TS_JEST) {
            /* istanbul ignore next */
            console.log(executeTime, sql)
        }

        if (!rows?.[0]) return null

        return (rows[0] as (string | number | boolean | null | Date | bigint)[]).reduce(
            (obj, curr, idx) => Object.assign(obj, { [fields![idx].fieldName]: curr }),
            {}
        ) as T
    }

    async queryRows<T>(sql: string, options?: QueryOptions): Promise<T[]> {
        const { rows, fields, executeTime } = await this.query(sql, options)
        if (!process.env.PROD && !process.env.TS_JEST) {
            /* istanbul ignore next */
            console.log(executeTime, sql)
        }

        return (
            rows?.map(
                (row: (string | number | boolean | null | Date | bigint)[]) =>
                    row.reduce(
                        (obj, curr, idx) => Object.assign(obj, { [fields![idx].fieldName]: curr }),
                        {}
                    ) as T
            ) ?? []
        )
    }
}
export const postgres = new RaidHubPool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: "raidhub",
    min: process.env.PROD ? 5 : 1,
    max: process.env.PROD ? 100 : 10,
    acquireTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
})
