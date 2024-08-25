import { ClanStats } from "../schema/components/Clan"
import { postgres } from "../services/postgres"

export const getClanStats = async (membershipIds: bigint[] | string[]) => {
    const clanStats = await postgres.queryRow<ClanStats>(
        `WITH "member" AS (
            SELECT unnest($1)::bigint AS membership_id
        ),
        "ranked_scores" AS (
            SELECT 
                "membership_id",
                COALESCE(wpr."score", 0) AS "score",
                ROW_NUMBER() OVER (ORDER BY wpr."score" DESC) AS "intra_clan_ranking"
            FROM member
            LEFT JOIN "world_first_player_rankings" wpr USING (membership_id)
        )
        SELECT
            JSONB_BUILD_OBJECT(
                    'clears', SUM(player."clears"),
                    'averageClears', ROUND(AVG(COALESCE(player."clears", 0))),
                    'freshClears', SUM(player."fresh_clears"),
                    'averageFreshClears', ROUND(AVG(COALESCE(player."fresh_clears", 0))),
                    'sherpas', SUM(player."sherpas"),
                    'averageSherpas', ROUND(AVG(COALESCE(player."sherpas", 0))),
                    'timePlayedSeconds', SUM(player."total_time_played_seconds"),
                    'averageTimePlayedSeconds', ROUND(AVG(COALESCE(player."total_time_played_seconds", 0))),
                    'totalContestScore', SUM(rs."score"),
                    'weightedContestScore', COALESCE(SUM(rs."score" * POWER(0.9, rs."intra_clan_ranking" - 6))::DOUBLE PRECISION / (POWER(1 + COUNT(player), (1 / 3))), 0)
            ) AS "aggregateStats",
            JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'playerInfo', CASE WHEN player IS NULL THEN NULL ELSE JSONB_BUILD_OBJECT(
                        'membershipId', player."membership_id"::text,
                        'membershipType', player."membership_type",
                        'iconPath', player."icon_path",
                        'displayName', player."display_name",
                        'bungieGlobalDisplayName', player."bungie_global_display_name",
                        'bungieGlobalDisplayNameCode', player."bungie_global_display_name_code",
                        'lastSeen', player."last_seen",
                        'isPrivate', player."is_private"
                    ) END,
                    'stats', JSONB_BUILD_OBJECT(
                        'clears', COALESCE(player."clears", 0),
                        'freshClears',  COALESCE(player."fresh_clears", 0),
                        'sherpas',  COALESCE(player."sherpas", 0),
                        'totalTimePlayedSeconds', COALESCE(player."total_time_played_seconds", 0),
                        'contestScore', COALESCE(rs."score", 0)
                    )
                )
            ) AS "members"
        FROM member
        LEFT JOIN player USING (membership_id)
        LEFT JOIN ranked_scores rs USING (membership_id)`,
        {
            params: [membershipIds]
        }
    )
    if (!clanStats) {
        throw new TypeError("Unexpected null value")
    }

    return clanStats
}
