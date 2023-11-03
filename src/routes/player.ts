import { Router } from "express"
import { failure, success } from "~/util"
import { prisma } from "~/prisma"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { isContest, isDayOne, isWeekOne } from "~/data/raceDates"
import { AllRaidHashes } from "./manifest"

export const playerRouter = Router()

playerRouter.get("/:membershipId", async (req, res) => {
    try {
        const membershipId = BigInt(req.params.membershipId)

        try {
            const data = await getPlayer({ membershipId })
            res.status(200).json(success(data))
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError) {
                res.status(500).json(failure(e, "Internal server error"))
            } else {
                res.status(404).json(failure(e))
            }
        }
    } catch (e) {
        res.status(400).json(
            failure({ membershipId: req.params.membershipId }, "Invalid membershipId")
        )
    }
})

async function getPlayer({ membershipId }: { membershipId: bigint }) {
    const [player, activityLeaderboardEntries] = await Promise.all([
        prisma.player.findUnique({
            where: {
                membershipId
            }
        }),
        prisma.activityLeaderboardEntry.findMany({
            where: {
                activity: {
                    playerActivity: {
                        some: {
                            player: {
                                membershipId
                            }
                        }
                    }
                }
            },
            select: {
                rank: true,
                instanceId: true,
                activity: {
                    select: {
                        raidHash: true,
                        dateCompleted: true,
                        dateStarted: true
                    }
                },
                leaderboardId: true
            }
        })
    ])

    if (!player) {
        throw Error("Player not found")
    }

    const activityLeaderboardEntriesMap = new Map<
        string,
        {
            rank: number
            leaderboardId: string
            instanceId: bigint
            activity: {
                raidHash: bigint
                dateStarted: Date
                dateCompleted: Date
            }
        }[]
    >()
    activityLeaderboardEntries.forEach(entry => {
        if (activityLeaderboardEntriesMap.has(entry.leaderboardId)) {
            activityLeaderboardEntriesMap.get(entry.leaderboardId)!.push(entry)
        } else {
            activityLeaderboardEntriesMap.set(entry.leaderboardId, [entry])
        }
    })

    return {
        player: {
            ...player,
            membershipId: String(player.membershipId)
        },
        activityLeaderboardEntries: Array.from(activityLeaderboardEntriesMap.entries()).map(
            ([leaderboardId, entries]) => ({
                [leaderboardId]: entries
                    .sort((a, b) => a.rank - b.rank)
                    .map(entry => {
                        const { raid } = AllRaidHashes[String(entry.activity.raidHash)]
                        return {
                            rank: entry.rank,
                            instanceId: String(entry.instanceId),
                            activity: {
                                ...entry.activity,
                                raidHash: String(entry.activity.raidHash)
                            },
                            dayOne: isDayOne(raid, entry.activity.dateCompleted),
                            contest: isContest(raid, entry.activity.dateStarted),
                            weekOne: isWeekOne(raid, entry.activity.dateCompleted)
                        }
                    })
            })
        )
    }
}
