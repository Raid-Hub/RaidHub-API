import { ErrorRequestHandler } from "express"
import { ErrorCode } from "../schema/errors/ErrorCode"
import { zInternalServerError } from "../schema/errors/InternalServerError"

// This is the final middleware run, so it cannot point to next
export const errorHandler: ErrorRequestHandler = (err: Error, _, res, __) => {
    /* istanbul ignore next */
    !process.env.TS_JEST && console.error(err)

    res.status(500).send({
        minted: new Date(),
        success: false,
        code: ErrorCode.InternalServerError,
        error: {
            message: "Internal Server Error"
        }
    } satisfies (typeof zInternalServerError)["_input"])
}
