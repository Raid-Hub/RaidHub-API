import {
    PrismaClientInitializationError,
    PrismaClientKnownRequestError,
    PrismaClientUnknownRequestError,
    PrismaClientValidationError
} from "@prisma/client/runtime/library"
import { ErrorRequestHandler } from "express"
import { serverError } from "../RaidHubErrors"
import { z } from "../util/zod"

// This is the final middleware run, so it cannot point to next
export const errorHandler: ErrorRequestHandler = (err: Error, _, res, next) => {
    let details: z.infer<typeof serverError>["error"] & Record<string, any> = {
        type: "unknown",
        at: null
    }

    if (
        err instanceof PrismaClientInitializationError ||
        err instanceof PrismaClientValidationError ||
        err instanceof PrismaClientUnknownRequestError ||
        err instanceof PrismaClientKnownRequestError
    ) {
        details = {
            type: err.name,
            at: err.message.split("`")[1]
        }
    }

    console.error(err)

    res.status(500).send({
        message: "Something went wrong.",
        minted: new Date(),
        success: false,
        statusCode: 500,
        error: details
    } satisfies z.infer<typeof serverError>)
}
