import { PrismaClientValidationError } from "@prisma/client/runtime/library"
import e, { ErrorRequestHandler, RequestHandler } from "express"
import { failure } from "~/util"

// This is the final middleware run, so it cannot point to next
export const errorHandler: ErrorRequestHandler = (err: Error, _, res, next) => {
    let details: any = "Unknown"

    if (err instanceof PrismaClientValidationError) {
        details = {
            ...err
        }
    }

    console.error(err)

    res.status(500).send(failure(details, "Something went wrong."))
}
