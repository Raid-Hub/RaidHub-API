import { Pool, PoolClient } from "pg"
import dotenv from "dotenv"

dotenv.config()

const pool = new Pool({
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DBNAME,
    ssl: false
})

export async function openPostgresClient(callback: (client: PoolClient) => Promise<void>) {
    const client = await pool.connect()
    await callback(client)
    client.release()
}
