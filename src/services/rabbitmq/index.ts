import amqp from "amqplib"

const port = process.env.RABBITMQ_PORT ?? 5672

export const rabbitmq = amqp
    .connect(
        `amqp://${process.env.RABBITMQ_USER ?? "guest"}:${process.env.RABBITMQ_PASSWORD ?? "guest"}@localhost:${port}`
    )
    .catch(console.warn)
