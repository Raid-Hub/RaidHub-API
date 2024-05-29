import { RabbitQueue } from "../queue"

export const playersQueue = new RabbitQueue<{
    membershipId: bigint
}>({
    queueName: "player_requests"
})
