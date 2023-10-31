import { Router } from "express"
import { failure, success } from "~/util"
import { prisma } from "~/prisma"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { isContest, isDayOne, isWeekOne } from "~/data/raceDates"
import { AllRaidHashes } from "./manifest"

export const playerRouter = Router()

playerRouter.get("/:membershipId", async (req, res) => {
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

    return {
        player: {
            ...player,
            membershipId: String(player.membershipId)
        },
        activityLeaderboardEntries: Object.fromEntries(
            activityLeaderboardEntries.map(({ leaderboardId, ...entry }) => {
                const { raid } = AllRaidHashes[String(entry.activity.raidHash)]
                return [
                    leaderboardId,
                    {
                        ...entry,
                        dayOne: isDayOne(raid, entry.activity.dateCompleted),
                        contest: isContest(raid, entry.activity.dateStarted),
                        weekOne: isWeekOne(raid, entry.activity.dateCompleted)
                    }
                ]
            })
        )
    }
}
