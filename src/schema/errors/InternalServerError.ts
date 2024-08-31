import { z } from "zod"
import { registerError } from "../RaidHubResponse"
import { ErrorCode } from "./ErrorCode"

export type InternalServerError = z.input<typeof zInternalServerError>
export const zInternalServerError = registerError(
    ErrorCode.InternalServerError,
    z.object({
        message: z.string()
    })
)
