import { z } from "zod"
import { registerError } from "../RaidHubResponse"
import { ErrorCode } from "./ErrorCode"
import { zZodIssue } from "./ZodIssue"

export const zPathValidationError = registerError(
    ErrorCode.PathValidationError,
    z.object({
        issues: z.array(zZodIssue)
    })
)
