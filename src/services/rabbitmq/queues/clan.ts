import { RabbitQueue } from "../queue"

export const clanQueue = new RabbitQueue<{
    groupId: bigint
}>({
    queueName: "clan"
})
