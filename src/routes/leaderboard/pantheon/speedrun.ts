import { z } from "zod"
import { type PantheonLeaderboardEntry } from "."
import { RaidHubRoute } from "../../../RaidHubRoute"
import { UrlPathsToPantheonVersion } from "../../../data/leaderboards"
import { cacheControl } from "../../../middlewares/cache-control"
import { prisma } from "../../../services/prisma"
import { ok } from "../../../util/response"
import { zLeaderboardQueryPagination, zPantheonPath, zWorldFirstLeaderboardEntry } from "../_schema"

export const pantheonSpeedrunRoute = new RaidHubRoute({
    method: "get",
    params: z.object({
        version: zPantheonPath
    }),
    query: zLeaderboardQueryPagination,
    middlewares: [cacheControl(10)],
    async handler(req) {
        const version = UrlPathsToPantheonVersion[req.params.version]
        const offset = req.query.count * (req.query.page - 1)

        const entries = await prisma.$queryRaw<PantheonLeaderboardEntry[]>`
        SELECT 
            (ROW_NUMBER() OVER (ORDER BY "duration" ASC)) AS "position",
            (RANK() OVER (ORDER BY "duration" ASC)) AS "rank",
            "duration" AS "value",
            JSONB_BUILD_OBJECT(
                'instanceId', "instance_id",
                'hash', "hash",
                'completed', "completed",
                'fresh', "fresh",
                'flawless', "flawless",
                'playerCount', "player_count",
                'dateStarted', "date_started",
                'dateCompleted', "date_completed",
                'duration', "duration",
                'platformType', "platform_type",
                'score', "score"
            ) AS "activity",
            "t1"."players_json" AS "players"
        FROM "activity"
        LEFT JOIN LATERAL (
            SELECT JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'data', JSONB_BUILD_OBJECT(
                        'completed', "ap"."completed", 
                        'sherpas', "ap"."sherpas", 
                        'isFirstClear', "ap"."is_first_clear", 
                        'timePlayedSeconds', "ap"."time_played_seconds"  
                    ),
                    'player', JSONB_BUILD_OBJECT(
                        'membershipId', "player"."membership_id", 
                        'membershipType', "membership_type", 
                        'iconPath', "icon_path", 
                        'displayName', "display_name", 
                        'bungieGlobalDisplayName', "bungie_global_display_name", 
                        'bungieGlobalDisplayNameCode', "bungie_global_display_name_code", 
                        'lastSeen', "last_seen"
                    )
                )
            ) AS "players_json"
            FROM "activity_player" AS "ap" 
            LEFT JOIN "player" ON "player"."membership_id" = "ap"."membership_id"
            WHERE "activity"."instance_id" = "ap"."instance_id"
        ) AS "t1" ON true 
        WHERE "hash" = (
            SELECT "hash" FROM "activity_hash" WHERE "version_id" = ${version} LIMIT 1
        ) AND "completed" AND "fresh"
        ORDER BY "duration" ASC
        OFFSET ${offset}
        LIMIT ${req.query.count}`

        return ok({
            params: {
                ...req.params,
                ...req.query
            },
            entries
        })
    },
    response: {
        success: {
            statusCode: 200,
            schema: z
                .object({
                    params: z
                        .object({
                            version: zPantheonPath
                        })
                        .merge(zLeaderboardQueryPagination)
                        .strict(),
                    entries: z.array(zWorldFirstLeaderboardEntry)
                })
                .strict()
        },
        errors: []
    }
})
