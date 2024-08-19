import { ClanLeaderboardEntry } from "../schema/components/Clan"
import { postgres } from "../services/postgres"

export const getClanStats = async (groupId: bigint | string) => {
    return await postgres.queryRow<ClanLeaderboardEntry>(
        `SELECT
            JSONB_BUILD_OBJECT(
                'groupId', clan."group_id",
                'name', clan.name,
                'callSign', clan.call_sign,
                'motto', clan."motto",
                'clanBannerData', clan."clan_banner_data",
                'lastUpdated', TO_CHAR(clan."updated_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
            ) AS "clan",
            "known_member_count" AS "knownMemberCount",
            "clears",
            "average_clears" AS "averageClears",
            "fresh_clears" AS "freshClears",
            "average_fresh_clears" AS "averageFreshClears",
            "sherpas",
            "average_sherpas" AS "averageSherpas",
            "time_played_seconds" AS "timePlayedSeconds",
            "average_time_played_seconds" AS "averageTimePlayedSeconds",
            "total_contest_score" AS "totalContestScore",
            "weighted_contest_score" AS "weightedContestScore"
        FROM clan_leaderboard
        INNER JOIN clan USING (group_id)
        WHERE group_id = $1::bigint`,
        {
            params: [groupId]
        }
    )
}
