import { z } from "zod"
import { registerError } from "../RaidHubResponse"
import { ErrorCode } from "./ErrorCode"
import { zZodIssue } from "./ZodIssue"

export const zQueryValidationError = registerError(
    ErrorCode.QueryValidationError,
    z.object({
        issues: z.array(zZodIssue)
    })
)
