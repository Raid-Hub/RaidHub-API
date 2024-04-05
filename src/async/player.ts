import { rabbitmq } from "."

interface PlayerRequest {
    membershipId: bigint
}

const channel = rabbitmq.then(conn => conn?.createChannel())

const queueName = "player_requests"
export async function sendAsyncPlayerRequest(request: PlayerRequest) {
    const chan = await channel
    if (!chan) {
        return false
    }

    return chan
        ?.assertQueue(queueName, {
            durable: false
        })
        .then(() => {
            const message = JSON.stringify(request)
            return chan.sendToQueue(queueName, Buffer.from(message))
        })
        .catch(e => {
            console.error(e)
            return false
        })
}
