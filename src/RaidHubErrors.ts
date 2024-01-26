import { z } from "./util/zod"

/**
 * The below errors are various errors that middleware can throw
 */
//

export const validationError = z.object({
    minted: z.date(),
    message: z.union([
        z.literal("Invalid path params"),
        z.literal("Invalid query params"),
        z.literal("Invalid JSON body")
    ]),
    success: z.literal(false),
    statusCode: z.union([z.literal(400), z.literal(404)]),
    error: z.any()
})

export const serverError = z.object({
    message: z.literal("Something went wrong."),
    minted: z.date(),
    success: z.literal(false),
    statusCode: z.literal(500),
    error: z.object({
        type: z.string(),
        at: z.string().nullable()
    })
})

export const adminProtectedError = z.object({
    message: z.literal("Forbidden"),
    minted: z.date(),
    success: z.literal(false),
    statusCode: z.literal(403),
    error: z.object({
        type: z.literal("forbidden")
    })
})

export const corsError = z.object({
    message: z.union([z.literal("Invalid API Key"), z.literal("Missing API Key")]),
    minted: z.date(),
    success: z.literal(false),
    statusCode: z.literal(401),
    error: z.object({
        type: z.literal("cors"),
        apiKey: z.string().nullable(),
        origin: z.string().nullable()
    })
})
