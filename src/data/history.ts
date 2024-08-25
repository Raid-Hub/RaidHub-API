import { InstanceForPlayer } from "../schema/components/InstanceForPlayer"
import { postgres } from "../services/postgres"
import { activityHistoryQueryTimer } from "../services/prometheus/metrics"
import { withHistogramTimer } from "../services/prometheus/util"

export const getActivities = async (
    membershipId: bigint | string,
    {
        count,
        cursor,
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
            cursor: String(!!cursor),
            cutoff: String(!!cutoff)
        },
        async () => {
            const params: (string | number | bigint | Date)[] = [membershipId, count]
            if (cursor) params.push(cursor)
            if (cutoff) params.push(cutoff)

            return await postgres.queryRows<InstanceForPlayer>(
                `SELECT * FROM (
                    SELECT 
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
                    AND date_completed < ${cursor ? "$3" : "(SELECT last_seen + interval '1 second' FROM player WHERE membership_id = $1::bigint)"}
                    ${cutoff ? `AND date_completed > ${cursor ? "$4" : "$3"}` : ""}
                    ORDER BY date_completed DESC
                    ${!cutoff ? "LIMIT $2" : ""}
                ) as __inner__   
                LIMIT $2;`,
                {
                    params: params,
                    fetchCount: count
                }
            )
        }
    )
}
