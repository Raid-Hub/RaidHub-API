import { z } from "zod"
import { registerError } from "../RaidHubResponse"
import { ErrorCode } from "./ErrorCode"

export const zInsufficientPermissionsError = registerError(
    ErrorCode.InsufficientPermissionsError,
    z.object({
        message: z.literal("Forbidden")
    })
)
