import { Instance } from "../schema/components/Instance"
import { InstanceExtended } from "../schema/components/InstanceExtended"
import { InstanceMetadata } from "../schema/components/InstanceMetadata"
import { InstancePlayerExtended } from "../schema/components/InstancePlayerExtended"
import { postgres } from "../services/postgres"

export async function getInstance(instanceId: bigint | string): Promise<Instance | null> {
    return await postgres.queryRow<Instance>(
        `SELECT 
            instance_id::text AS "instanceId",
            hash::text AS "hash",
            activity_id AS "activityId",
            version_id AS "versionId",
            completed AS "completed",
            player_count AS "playerCount",
            score AS "score",
            fresh AS "fresh",
            flawless AS "flawless",
            date_started AS "dateStarted",
            date_completed AS "dateCompleted",
            duration AS "duration",
            platform_type AS "platformType"
        FROM activity
        INNER JOIN activity_hash USING (hash)
        WHERE instance_id = $1::bigint
        LIMIT 1;`,
        {
            params: [instanceId]
        }
    )
}

export async function getInstanceExtended(
    instanceId: bigint | string
): Promise<InstanceExtended | null> {
    const instanceQuery = getInstance(instanceId)
    const instancePlayers = await postgres.queryRows<InstancePlayerExtended>(
        `
        SELECT 
            completed as "completed",
            is_first_clear as "isFirstClear",
            ap.sherpas as "sherpas",
            time_played_seconds as "timePlayedSeconds",
            JSONB_BUILD_OBJECT(
                'membershipId', "membership_id"::text, 
                'membershipType', "membership_type", 
                'iconPath', "icon_path", 
                'displayName', "display_name", 
                'bungieGlobalDisplayName', "bungie_global_display_name", 
                'bungieGlobalDisplayNameCode', "bungie_global_display_name_code", 
                'lastSeen', "last_seen"
            ) AS "playerInfo", 
            "t1"."characters_json" AS "characters"
        FROM "activity_player" "ap"
        LEFT JOIN "player" USING (membership_id)
        LEFT JOIN LATERAL (
            SELECT JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'characterId', "character_id"::text, 
                    'classHash', "class_hash"::text, 
                    'emblemHash', "emblem_hash"::text, 
                    'completed', "completed", 
                    'timePlayedSeconds', "time_played_seconds", 
                    'startSeconds', "start_seconds", 
                    'score', "score", 
                    'kills', "kills", 
                    'assists', "assists", 
                    'deaths', "deaths", 
                    'precisionKills', "precision_kills", 
                    'superKills', "super_kills", 
                    'grenadeKills', "grenade_kills", 
                    'meleeKills', "melee_kills", 
                    'weapons', "t2"."weapons_json"
                )
            ) AS "characters_json"
            FROM "activity_character" "ac"  
            LEFT JOIN LATERAL (
                SELECT COALESCE(JSONB_AGG(
                    JSONB_BUILD_OBJECT(
                        'weaponHash', "weapon_hash"::text, 
                        'kills', "kills", 
                        'precisionKills', "precision_kills"
                    )
                ), '[]'::jsonb) AS "weapons_json"
                FROM "activity_character_weapon" AS "acw"
                WHERE "acw"."character_id" = "ac"."character_id"
                    AND "acw"."membership_id" = "ac"."membership_id" 
                    AND "acw"."instance_id" = "ac"."instance_id" 
            ) as "t2" ON true
            WHERE "ap"."membership_id" = "ac"."membership_id"
                AND "ap"."instance_id" = "ac"."instance_id"
        ) AS "t1" ON true 
        WHERE instance_id = $1::bigint
        ORDER BY completed DESC, time_played_seconds DESC;`,
        {
            params: [instanceId]
        }
    )

    return await instanceQuery.then(async instance =>
        instance
            ? {
                  ...instance,
                  metadata: await getInstanceMetadataByHash(instance.hash),
                  players: instancePlayers
              }
            : null
    )
}

export async function getInstanceMetadataByHash(hash: bigint | string): Promise<InstanceMetadata> {
    const metaData = await postgres.queryRow<InstanceMetadata>(
        `SELECT 
            ad.name AS "activityName",
            vd.name AS "versionName",
            ad.is_raid AS "isRaid"
        FROM activity_hash ah
        INNER JOIN activity_definition ad ON ad.id = ah.activity_id
        INNER JOIN version_definition vd ON vd.id = ah.version_id
        WHERE hash = $1::bigint
        LIMIT 1;`,
        {
            params: [hash]
        }
    )
    if (!metaData) {
        throw new Error("Metadata not found")
    }
    return metaData
}
