import { RequestHandler } from "express"
import { sendAsyncPlayerRequest } from "../async"

export const processPlayerAsync: RequestHandler<{ membershipId: bigint }> = async (
    req,
    res,
    next
) => {
    res.on("finish", async () => {
        await sendAsyncPlayerRequest({ membershipId: req.params.membershipId })
    })
    next()
}
