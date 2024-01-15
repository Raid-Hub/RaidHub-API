import { RaidHubRoute } from "route"
import { playerRouterParams } from "."
import { cacheControl } from "~/middlewares/cache-control"
import { prisma } from "~/prisma"
import { failure, success } from "util/helpers"
import { isContest, isDayOne, isWeekOne } from "~/data/raceDates"
import { ListedRaid } from "~/data/raids"

export const playerProfileRoute = new RaidHubRoute({
    method: "get",
    params: playerRouterParams,
    middlewares: [cacheControl(60)],
    async handler(req, res, next) {
        try {
            const data = await getPlayer({ membershipId: req.params.membershipId })
            if (!data) {
                res.status(404).json(failure({}, "Player not found"))
            } else {
                res.status(200).json(success(data))
            }
        } catch (e) {
            next(e)
        }
    }
})

type PrismaRawLeaderboardEntry = {
    rank: number
    leaderboard_id: string
    instance_id: bigint
    raid_hash: bigint
    raid_id: ListedRaid
    date_completed: Date
    date_started: Date
}

async function getPlayer({ membershipId }: { membershipId: bigint }) {
    const [player, activityLeaderboardEntries] = await Promise.all([
        prisma.player.findUnique({
            where: {
                membershipId: membershipId
            }
        }),
        await prisma.$queryRaw<Array<PrismaRawLeaderboardEntry>>`
            SELECT 
                ale.rank, 
                lb.id AS leaderboard_id,
                a.instance_id,
                a.raid_hash,
                a.date_started,
                a.date_completed,
                rd.raid_id
            FROM 
                activity_leaderboard_entry ale
            JOIN player_activity pa ON pa.instance_id = ale.instance_id 
                AND pa.membership_id = ${membershipId}::bigint 
                AND pa.finished_raid
            JOIN activity a ON pa.instance_id = a.instance_id
            JOIN raid_definition rd ON a.raid_hash = rd.hash
            JOIN leaderboard lb ON ale.leaderboard_id = lb.id;
            `
    ])

    if (!player) {
        return null
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
                        return {
                            rank: entry.rank,
                            instanceId: entry.instance_id,
                            raidHash: entry.raid_hash,
                            dayOne: isDayOne(entry.raid_id, entry.date_completed),
                            contest: isContest(entry.raid_id, entry.date_started),
                            weekOne: isWeekOne(entry.raid_id, entry.date_completed)
                        }
                    })
            ])
        )
    }
}
