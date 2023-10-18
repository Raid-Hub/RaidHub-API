import { Pool, PoolClient } from "pg"
import dotenv from "dotenv"

dotenv.config()

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: false
})

export async function openPostgresClient(callback: (client: PoolClient) => Promise<void>) {
    const client = await pool.connect()
    await callback(client)
    client.release()
}
