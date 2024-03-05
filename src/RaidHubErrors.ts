import { ZodIssueCode } from "zod"
import { ErrorCode, registry } from "./schema/common"
import { z, zISODateString } from "./schema/zod"

/**
 * The below errors are various errors that middleware can throw
 */
//

export const zRaidHubErrorCode = registry.register("RaidHubErrorCode", z.nativeEnum(ErrorCode))

export const zRaidHubError = registry.register(
    "RaidHubError",
    z.object({
        minted: zISODateString(),
        message: z.string(),
        success: z.literal(false),
        error: z
            .object({
                type: z.nativeEnum(ErrorCode)
            })
            .catchall(z.any())
    })
)

const zZodIssue = registry.register(
    "ZodIssue",
    z.object({
        fatal: z.boolean().optional(),
        message: z.string(),
        path: z.array(z.union([z.string(), z.number()])),
        code: z.nativeEnum(ZodIssueCode)
    })
)

export const zPathValidationError = registry.register(
    ErrorCode.PathValidationError,
    zRaidHubError.extend({
        message: z.literal("Invalid path params"),
        error: z.object({
            type: z.literal(ErrorCode.PathValidationError),
            issues: z.array(zZodIssue)
        })
    })
)
export const zQueryValidationError = registry.register(
    ErrorCode.QueryValidationError,
    zRaidHubError.extend({
        message: z.literal("Invalid query params"),
        error: z.object({
            type: z.literal(ErrorCode.QueryValidationError),
            issues: z.array(zZodIssue)
        })
    })
)
export const zBodyValidationError = registry.register(
    ErrorCode.BodyValidationError,
    zRaidHubError.extend({
        message: z.literal("Invalid JSON body"),
        error: z.object({
            type: z.literal(ErrorCode.BodyValidationError),
            issues: z.array(zZodIssue)
        })
    })
)

export const zServerError = registry.register(
    ErrorCode.InternalServerError,
    zRaidHubError.extend({
        message: z.literal("Something went wrong."),
        error: z.object({
            type: z.literal(ErrorCode.InternalServerError),
            at: z.string().nullable()
        })
    })
)

export const zInsufficientPermissionsError = registry.register(
    ErrorCode.InsufficientPermissionsError,
    zRaidHubError.extend({
        error: z.object({
            type: z.literal(ErrorCode.InsufficientPermissionsError),
            message: z.literal("Forbidden")
        })
    })
)

export const zApiKeyError = registry.register(
    ErrorCode.ApiKeyError,
    zRaidHubError.extend({
        message: z.union([z.literal("Invalid API Key"), z.literal("Missing API Key")]),
        error: z.object({
            type: z.literal(ErrorCode.ApiKeyError),
            apiKey: z.string().nullable(),
            origin: z.string().nullable()
        })
    })
)
