import { RabbitConnection } from "./connection"

export const rabbitmq = new RabbitConnection({
    user: process.env.RABBITMQ_USER ?? "guest",
    password: process.env.RABBITMQ_PASSWORD ?? "guest",
    port: process.env.RABBITMQ_PORT ?? 5672
})
