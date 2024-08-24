import { RequestHandler } from "express"
import { clanQueue } from "../services/rabbitmq/queues/clan"

export const processClanAsync: RequestHandler<{ groupId: bigint }> = async (req, res, next) => {
    res.on("finish", () => {
        if (res.statusCode == 200) {
            clanQueue.send({ groupId: req.params.groupId })
        }
    })
    next()
}
