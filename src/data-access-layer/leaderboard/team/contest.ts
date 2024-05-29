import { TeamLeaderboardEntry } from "../../../schema/components/LeaderboardData"
import { postgres } from "../../../services/postgres"

export const getContestTeamLeaderboard = async ({
    raidId,
    skip,
    take
}: {
    raidId: number
    skip: number
    take: number
}) => {
    return await postgres.queryRows<TeamLeaderboardEntry>(
        `SELECT
            position,
            rank,
            time_after_launch AS "value",
            instance_id::text as "instanceId",
            "lateral".players
        FROM world_first_contest_leaderboard
        LEFT JOIN LATERAL (
            SELECT 
                JSONB_AGG(
                    JSONB_BUILD_OBJECT(
                        'membershipId', membership_id::text,
                        'membershipType', membership_type,
                        'iconPath', icon_path,
                        'displayName', display_name,
                        'bungieGlobalDisplayName', bungie_global_display_name,
                        'bungieGlobalDisplayNameCode', bungie_global_display_name_code,
                        'lastSeen', last_seen
                    )
                ) as "players"
            FROM activity_player
            INNER JOIN player USING (membership_id)
            WHERE activity_player.instance_id = world_first_contest_leaderboard.instance_id
                AND activity_player.completed
        ) as "lateral" ON true
        WHERE position > $1 AND position <= ($1 + $2)
            AND activity_id = $3
        ORDER BY position ASC`,
        {
            params: [skip, take, raidId]
        }
    )
}

export const searchContestTeamLeaderboard = async ({
    raidId,
    membershipId,
    take
}: {
    raidId: number
    membershipId: bigint | string
    take: number
}) => {
    const result = await postgres.queryRow<{ position: number }>(
        `SELECT position 
        FROM world_first_contest_leaderboard 
        WHERE membership_ids @> $1::jsonb
            AND activity_id = $2
        ORDER BY position ASC
        LIMIT 1`,
        {
            params: [`${[membershipId]}`, raidId]
        }
    )
    if (!result) return null

    return await getContestTeamLeaderboard({
        raidId,
        skip: (Math.ceil(result.position / take) - 1) * take,
        take
    })
}
