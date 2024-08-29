import { z } from "zod"
import { registerError } from "../RaidHubResponse"
import { ErrorCode } from "./ErrorCode"
import { zZodIssue } from "./ZodIssue"

export type QueryValidationError = z.input<typeof zQueryValidationError>
export const zQueryValidationError = registerError(
    ErrorCode.QueryValidationError,
    z.object({
        issues: z.array(zZodIssue)
    })
)
