import { ZodObject, ZodRawShape, ZodType, z } from "zod"
import { registry } from "."
import { ErrorCode, zErrorCode } from "./errors/ErrorCode"
import { zISODateString } from "./util"

export const zRaidHubResponse = registry.register(
    "RaidHubResponse",
    z.discriminatedUnion("success", [
        z
            .object({
                minted: zISODateString(),
                success: z.literal(true),
                response: z.unknown()
            })
            .strict(),
        z
            .object({
                minted: zISODateString(),
                success: z.literal(false),
                code: zErrorCode,
                error: z.unknown()
            })
            .strict()
    ])
)

export const registerResponse = (path: string, schema: ZodType) =>
    registry.register(
        path
            .replace(/\/{[^/]+}/g, "")
            .split("/")
            .filter(Boolean)
            .map(str => str.charAt(0).toUpperCase() + str.slice(1))
            .join("") + "Response",
        schema
    )

export const registerError = <T extends ZodRawShape>(code: ErrorCode, schema: ZodObject<T>) =>
    registry.register(
        code,
        z.object({
            minted: zISODateString(),
            success: z.literal(false),
            code: z.literal(code),
            error: schema
        })
    )

export type RaidHubResponse<T, E, C extends ErrorCode> = {
    minted: Date
} & ({ success: true; response: T } | { success: false; error: E; code: C })
