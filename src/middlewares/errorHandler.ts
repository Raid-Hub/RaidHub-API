import {
    PrismaClientInitializationError,
    PrismaClientKnownRequestError,
    PrismaClientUnknownRequestError,
    PrismaClientValidationError
} from "@prisma/client/runtime/library"
import { ErrorRequestHandler } from "express"
import { zServerError } from "../RaidHubErrors"
import { z } from "../schema/zod"

// This is the final middleware run, so it cannot point to next
export const errorHandler: ErrorRequestHandler = (err: Error, _, res, __) => {
    let details: z.infer<typeof zServerError>["error"] & Record<string, unknown> = {
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
        error: details
    } satisfies (typeof zServerError)["_input"])
}
