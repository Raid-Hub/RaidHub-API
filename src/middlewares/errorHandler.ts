import {
    PrismaClientUnknownRequestError,
    PrismaClientValidationError
} from "@prisma/client/runtime/library"
import { ErrorRequestHandler } from "express"
import { serverError } from "../RaidHubRoute"
import { z } from "zod"

// This is the final middleware run, so it cannot point to next
export const errorHandler: ErrorRequestHandler = (err: Error, _, res, next) => {
    let details: any = "Unknown"

    if (err instanceof PrismaClientValidationError) {
        details = {
            ...err
        }
    }

    if (err instanceof PrismaClientUnknownRequestError) {
        details = {
            ...err,
            cause: err.message.split("`")[1]
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
