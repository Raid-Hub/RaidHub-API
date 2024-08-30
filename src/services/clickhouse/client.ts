import {
    ClickHouseLogLevel,
    ErrorLogParams,
    LogParams,
    Logger,
    WarnLogParams,
    createClient
} from "@clickhouse/client"

class ClickhouseLogger implements Logger {
    trace(params: LogParams): void {
        console.trace(`[${params.module}] ${params.message}`, params.args)
    }
    debug(params: LogParams): void {
        console.debug(`[${params.module}] ${params.message}`, params.args)
    }
    info(params: LogParams): void {
        console.info(`[${params.module}] ${params.message}`, params.args)
    }
    warn(params: WarnLogParams): void {
        console.warn(`[${params.module}] ${params.message}`, params.args, params.err)
    }
    error(params: ErrorLogParams): void {
        console.error(`[${params.module}] ${params.message}`, params.args, params.err)
    }
}

export const clickhouse = createClient({
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD,
    log: {
        LoggerClass: ClickhouseLogger,
        level:
            process.env.NODE_ENV === "development"
                ? ClickHouseLogLevel.DEBUG
                : ClickHouseLogLevel.ERROR
    }
})
