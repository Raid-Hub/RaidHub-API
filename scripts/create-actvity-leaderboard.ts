import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Usage: yarn leaderboard <hash>
async function main() {
    const hash = process.argv[4]
    const boardId = process.argv[5]
    if (!hash) {
        console.log("Missing hash")
        process.exit(1)
    }
    if (!boardId) {
        console.log("Missing boardId")
        process.exit(1)
    }
    console.log(`Seeding hash ${hash} into ${boardId}...`)
    const entries = await prisma.activity.findMany({
        where: {
            raidHash: hash,
            completed: true
        },
        orderBy: {
            dateCompleted: "asc"
        },
        include: {
            playerActivities: {
                select: {
                    player: {
                        select: {
                            membershipId: true,
                            membershipType: true,
                            iconPath: true,
                            displayName: true,
                            bungieGlobalDisplayName: true,
                            bungieGlobalDisplayNameCode: true
                        }
                    }
                }
            }
        },
        take: 1000
    })

    await prisma.activityLeaderboard.create({
        data: {
            id: boardId,
            entries: {
                create: entries.map((e, idx) => ({
                    activityId: e.activityId,
                    rank: idx + 1
                }))
            }
        }
    })
}

main()
    .then(() => console.log("Table building complete"))
    .then(() => process.exit(0))
