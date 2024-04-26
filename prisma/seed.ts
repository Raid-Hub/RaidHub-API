import { PrismaClient } from "@prisma/client"

const p = new PrismaClient()
const hashes = await p.activityHash.findMany({
    select: { hash: true },
    where: {
        activityId: 101
    }
})

console.log(hashes)

await p.activity.findMany({}).then(activities =>
    Promise.all(
        activities.map(async activity =>
            p.activity.update({
                data: {
                    hash: hashes[Math.floor(Math.random() * hashes.length)].hash
                },
                where: {
                    instanceId: activity.instanceId
                }
            })
        )
    )
)
