const { Pool } = require("pg")
require("dotenv").config()

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: false
})

async function main() {
    const client = await pool.connect()
    // We can seed the dev database with PGCRs and such here
    client.release()
}

main()
    .then(() => console.log("Seeding complete"))
    .then(() => process.exit(0))
