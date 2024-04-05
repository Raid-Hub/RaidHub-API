import amqp from "amqplib"

interface PlayerRequest {
    membershipId: bigint
}

const port = process.env.RABBITMQ_PORT ?? 5672

const rabbitmq = await amqp
    .connect(
        `amqp://${process.env.RABBITMQ_USER ?? "guest"}:${process.env.RABBITMQ_PASSWORD ?? "guest"}@localhost:${port}`
    )
    .catch(console.warn)

const channel = await rabbitmq?.createChannel()
const queueName = "player_requests"

await channel
    ?.assertQueue(queueName, {
        durable: false
    })
    .then(() => {
        console.log(`player_requests queue created on port ${port}`)
    })

export async function sendAsyncPlayerRequest(request: PlayerRequest) {
    const message = JSON.stringify(request)
    return channel?.sendToQueue(queueName, Buffer.from(message))
}
