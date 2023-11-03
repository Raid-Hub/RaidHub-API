import { Router } from "express"
import { failure, success } from "~/util"
import { prisma } from "~/prisma"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { isContest, isDayOne, isWeekOne } from "~/data/raceDates"
import { AllRaidHashes } from "./manifest"

export const playerRouter = Router()

playerRouter.use((_, res, next) => {
    // cache for 30s
    res.setHeader("Cache-Control", "max-age=30")
    next()
})

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

type PrismaRawLeaderboardEntry = {
    rank: number
    leaderboard_id: string
    instance_id: string
    raid_hash: string
    date_completed: Date
    date_started: Date
}
async function getPlayer({ membershipId }: { membershipId: bigint }) {
    const [player, activityLeaderboardEntries] = await Promise.all([
        prisma.player.findUnique({
            where: {
                membershipId
            }
        }),
        await prisma.$queryRaw<Array<PrismaRawLeaderboardEntry>>`
            SELECT 
                ale.rank, 
                lb.id AS leaderboard_id,
                pa.instance_id::text,
                pa.raid_hash::text,
                pa.date_started,
                pa.date_completed
            FROM 
                activity_leaderboard_entry ale
            JOIN 
                (
                    SELECT a.* 
                    FROM player_activity
                    JOIN activity a ON player_activity.instance_id = a.instance_id
                    WHERE membership_id = ${membershipId}::bigint AND finished_raid
                ) pa ON pa.instance_id = ale.instance_id
            JOIN leaderboard lb ON ale.leaderboard_id = lb.id;`
    ])

    if (!player) {
        throw Error("Player not found")
    }

    const activityLeaderboardEntriesMap = new Map<string, PrismaRawLeaderboardEntry[]>()
    activityLeaderboardEntries.forEach(entry => {
        if (activityLeaderboardEntriesMap.has(entry.leaderboard_id)) {
            activityLeaderboardEntriesMap.get(entry.leaderboard_id)!.push(entry)
        } else {
            activityLeaderboardEntriesMap.set(entry.leaderboard_id, [entry])
        }
    })

    return {
        player: {
            ...player,
            membershipId: String(player.membershipId)
        },
        activityLeaderboardEntries: Object.fromEntries(
            Array.from(activityLeaderboardEntriesMap.entries()).map(([leaderboardId, entries]) => [
                leaderboardId,
                entries
                    .sort((a, b) => a.rank - b.rank)
                    .map(entry => {
                        const { raid } = AllRaidHashes[entry.raid_hash]
                        return {
                            rank: entry.rank,
                            instanceId: entry.instance_id,
                            raidHash: String(entry.raid_hash),
                            dayOne: isDayOne(raid, entry.date_completed),
                            contest: isContest(raid, entry.date_started),
                            weekOne: isWeekOne(raid, entry.date_completed)
                        }
                    })
            ])
        )
    }
}
