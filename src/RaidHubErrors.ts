import { ZodIssueCode } from "zod"
import { registry } from "./schema/common"
import { z, zISODateString } from "./schema/zod"

/**
 * The below errors are various errors that middleware can throw
 */
//

export const zRaidHubError = registry.register(
    "RaidHubError",
    z.object({
        minted: zISODateString(),
        message: z.string(),
        success: z.literal(false),
        error: z.any()
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
    "PathValidationError",
    zRaidHubError.extend({
        message: z.literal("Invalid path params"),
        error: z.object({
            issues: z.array(zZodIssue)
        })
    })
)
export const zQueryValidationError = registry.register(
    "QueryValidationError",
    zRaidHubError.extend({
        message: z.literal("Invalid query params"),
        error: z.object({
            issues: z.array(zZodIssue)
        })
    })
)
export const zBodyValidationError = registry.register(
    "BodyValidationError",
    zRaidHubError.extend({
        message: z.literal("Invalid JSON body"),
        error: z.object({
            issues: z.array(zZodIssue)
        })
    })
)

export const zServerError = registry.register(
    "ServerError",
    zRaidHubError.extend({
        message: z.literal("Something went wrong."),
        error: z.object({
            type: z.string(),
            at: z.string().nullable()
        })
    })
)

export const zInsufficientPermissionsError = registry.register(
    "InsufficientPermissionsError",
    zRaidHubError.extend({
        message: z.literal("Forbidden")
    })
)

export const zApiKeyError = registry.register(
    "ApiKeyError",
    zRaidHubError.extend({
        message: z.union([z.literal("Invalid API Key"), z.literal("Missing API Key")]),
        error: z.object({
            type: z.literal("cors"),
            apiKey: z.string().nullable(),
            origin: z.string().nullable()
        })
    })
)
