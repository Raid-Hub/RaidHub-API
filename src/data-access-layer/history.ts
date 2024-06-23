import { InstanceForPlayer } from "../schema/components/InstanceForPlayer"
import { postgres } from "../services/postgres"
import { activityHistoryQueryTimer } from "../services/prometheus/metrics"
import { withHistogramTimer } from "../services/prometheus/util"

export const getActivities = async (
    membershipId: bigint | string,
    {
        count,
        cursor = new Date(),
        cutoff
    }: {
        count: number
        cutoff?: Date
        cursor?: Date
    }
) => {
    return await withHistogramTimer(
        activityHistoryQueryTimer,
        {
            count: count,
            cursor: String(cursor.getTime() !== 0),
            cutoff: String(!!cutoff)
        },
        () =>
            postgres.queryRows<InstanceForPlayer>(
                `SELECT 
                    instance_id::text AS "instanceId",
                    hash::text AS "hash",
                    activity_id AS "activityId",
                    version_id AS "versionId",
                    activity.completed AS "completed",
                    player_count AS "playerCount",
                    score AS "score",
                    fresh AS "fresh",
                    flawless AS "flawless",
                    date_started AS "dateStarted",
                    date_completed AS "dateCompleted",
                    duration AS "duration",
                    platform_type AS "platformType",
                    date_completed < COALESCE(day_one_end, TIMESTAMP 'epoch') AS "isDayOne",
                    date_completed < COALESCE(contest_end, TIMESTAMP 'epoch') AS "isContest",
                    date_completed < COALESCE(week_one_end, TIMESTAMP 'epoch') AS "isWeekOne",
                    JSONB_BUILD_OBJECT(
                        'completed', activity_player.completed,
                        'sherpas', activity_player.sherpas,
                        'isFirstClear', activity_player.is_first_clear,
                        'timePlayedSeconds', activity_player.time_played_seconds
                    ) as player
                FROM activity_player
                INNER JOIN activity USING (instance_id)
                INNER JOIN activity_hash USING (hash)
                INNER JOIN activity_definition ON activity_definition.id = activity_hash.activity_id
                WHERE membership_id = $1::bigint
                    AND date_completed < $2
                    ${cutoff ? "AND date_completed > $4" : ""}
                ORDER BY date_completed DESC
                LIMIT $3;`,
                {
                    params: cutoff
                        ? [membershipId, cursor, count, cutoff]
                        : [membershipId, cursor, count],
                    fetchCount: count
                }
            )
    )
}
