import { z } from "zod"
import { registerError } from "../RaidHubResponse"
import { ErrorCode } from "./ErrorCode"

export const zInternalServerError = registerError(
    ErrorCode.InternalServerError,
    z.object({
        message: z.literal("Internal Server Error")
    })
)
