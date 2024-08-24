import { ErrorRequestHandler } from "express"
import { ErrorCode } from "../schema/errors/ErrorCode"
import { zInternalServerError } from "../schema/errors/InternalServerError"

// This is the final middleware run, so it cannot point to next
export const errorHandler: ErrorRequestHandler = (err: Error, _, res, __) => {
    process.env.NODE_ENV !== "test" && console.error(err)

    res.status(500).send({
        minted: new Date(),
        success: false,
        code: ErrorCode.InternalServerError,
        error: {
            message: process.env.PROD ? "Internal Server Error" : err.message
        }
    } satisfies (typeof zInternalServerError)["_input"])
}
