import amqp from "amqplib"

interface PlayerRequest {
    membershipId: bigint
}

const port = process.env.RABBITMQ_PORT ?? 5672

const rabbitmq = amqp
    .connect(
        `amqp://${process.env.RABBITMQ_USER ?? "guest"}:${process.env.RABBITMQ_PASSWORD ?? "guest"}@localhost:${port}`
    )
    .catch(console.warn)

const queueName = "player_requests"

const channel = rabbitmq.then(conn => conn?.createChannel())

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
