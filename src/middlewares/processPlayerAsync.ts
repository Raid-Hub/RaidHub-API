import { RequestHandler } from "express"
import { sendAsyncPlayerRequest } from "../services/rabbitmq/player"

export const processPlayerAsync: RequestHandler<{ membershipId: bigint }> = async (
    req,
    res,
    next
) => {
    res.on("finish", () => sendAsyncPlayerRequest({ membershipId: req.params.membershipId }))
    next()
}
