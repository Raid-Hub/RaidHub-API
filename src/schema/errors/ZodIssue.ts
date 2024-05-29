import { ZodIssueCode, z } from "zod"
import { registry } from ".."

export const zZodIssue = registry.register(
    "ZodIssue",
    z.object({
        fatal: z.boolean().optional(),
        message: z.string(),
        path: z.array(z.union([z.string(), z.number()])),
        code: z.nativeEnum(ZodIssueCode)
    })
)
