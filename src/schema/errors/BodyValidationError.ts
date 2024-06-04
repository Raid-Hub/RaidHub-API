import { z } from "zod"
import { registerError } from "../RaidHubResponse"
import { ErrorCode } from "./ErrorCode"
import { zZodIssue } from "./ZodIssue"

export const zBodyValidationError = registerError(
    ErrorCode.BodyValidationError,
    z.object({
        issues: z.array(zZodIssue)
    })
)
