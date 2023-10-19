const { Pool } = require("pg")
require("dotenv").config()

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: false
})

async function main() {
    const name = process.argv[2]
    if (!name || typeof name !== "string") {
        console.error("Missing username to seed. Try yarn seed Username#0001")
        process.exit(1)
    }

    const [displayName, displayNameCode] = name.split("#")

    if (!displayName || !displayNameCode) {
        console.error(`Invalid username to seed: ${name}`)
        process.exit(1)
    }

    const user = await request(
        "https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayerByBungieName/-1/",
        {
            method: "POST",
            body: JSON.stringify({
                displayName,
                displayNameCode
            })
        }
    )
        .then(res => res.Response[0])
        .catch(e => {
            console.error(e)
            process.exit(1)
        })

    console.log(`Found user ${user.membershipId}`)

    const characters = await request(
        `https://www.bungie.net/Platform/Destiny2/${user.membershipType}/Profile/${user.membershipId}/?components=200`
    )
        .then(res => Object.keys(res.Response.characters.data))
        .catch(e => {
            console.error(e)
            process.exit(1)
        })

    console.log(`Found characters ${characters.join(", ")}`)

    const client = await pool.connect()

    const player = await client.query(
        "INSERT INTO players (membership_id) VALUES ($1) ON CONFLICT (membership_id) DO NOTHING",
        [user.membershipId]
    )

    const pgcrs = await client
        .query(
            "SELECT activities.activity_id FROM activities JOIN activity_players ON activities.activity_id = activity_players.activity_id WHERE activity_players.membership_id = $1;",
            [user.membershipId]
        )
        .then(data => new Set(data.rows.map(r => Number(r.activity_id))))

    console.log(`PGCRs already in database: ${pgcrs.size ? [...pgcrs].join(", ") : "None"}`)

    const COUNT = 250
    const THREADS = 3
    const allActivities = new Map()
    const pgcrQueue = new Set()

    // await Promise.all(
    //     characters.map(async characterId => {
    //         let page = 0
    //         while (true) {
    //             const activities = await Promise.all(
    //                 new Array(THREADS)
    //                     .fill(undefined)
    //                     .map((_, i) =>
    //                         request(
    //                             `https://www.bungie.net/Platform/Destiny2/${
    //                                 user.membershipType
    //                             }/Account/${
    //                                 user.membershipId
    //                             }/Character/${characterId}/Stats/Activities/?count=${COUNT}&mode=4&page=${
    //                                 page + i
    //                             }`
    //                         ).then(res => res.Response.activities)
    //                     )
    //             ).then(activities => activities.flat())

    //             console.log(`Found ${activities.length} activities on characterId ${characterId}`)
    //             if (activities.length < THREADS * COUNT) {
    //                 break
    //             }
    //             activities.forEach(a => {
    //                 const id = Number(a.activityDetails.instanceId)
    //                 allActivities.set(id, a)
    //                 if (!pgcrs.has(id)) {
    //                     pgcrQueue.add(id)
    //                 }
    //             })
    //             page += THREADS
    //         }
    //     })
    // )

    // let i = 0
    // const arr = Array.from(pgcrQueue)
    // while (i < arr.length) {
    //     const ids = arr.splice(i, i + 10)

    //     await Promise.all(
    //         ids.map(async id => {
    //             console.log(`Loading activity ${id}`)
    //             return request(
    //                 `https://stats.bungie.net/Platform/Destiny2/Stats/PostGameCarnageReport/${id}/`
    //             )
    //                 .then(res => res.Response)
    //                 .then(response => processCarnageReport(response, client))
    //                 .then(() => console.log(`Adddedd PGCR ${id} to the database`))
    //         })
    //     )
    //     i += 10
    // }

    client.release()
}

async function request(url, opts) {
    return fetch(url, {
        ...opts,
        headers: {
            "Content-Type": "application/json",
            ["X-API-KEY"]: process.env.DEV_BUNGIE_API_KEY
        }
    }).then(res => res.json())
}

async function processCarnageReport(report, client) {
    if (!report) {
        return
    }
    const activityQuery = `
INSERT INTO activities (activity_id, raid_hash, flawless, fresh, player_count, date_started, date_completed)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;`

    const playerQuery = `INSERT INTO activity_players (activity_id, membership_id) VALUES ($1, $2);`

    client
        .query(activityQuery, [
            Number(report.activityDetails.instanceId),
            Number(report.activityDetails.directorActivityHash),
            false,
            true,
            3,
            new Date(report.period),
            new Date(report.period)
        ])
        .then(res => {
            const activity = res.rows[0]
            const players = ["4611686018488107374"]

            const playerInsertPromises = players.map(player =>
                client.query(playerQuery, [activity.activity_id, player])
            )

            Promise.all(playerInsertPromises).catch(err => console.error(err))
        })
        .catch(err => console.error(err))
}

main()
    .then(() => console.log("Seeding complete"))
    .then(() => process.exit(0))
