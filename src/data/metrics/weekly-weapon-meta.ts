import { WeaponMetric } from "../../schema/components/Metrics"
import {
    WeaponAmmoType,
    WeaponElement,
    WeaponRarity,
    WeaponSlot
} from "../../schema/components/Weapon"
import { clickhouse } from "../../services/clickhouse/client"

export const getWeeklyWeaponMeta = async ({ sort }: { sort: "usage" | "kills" }) => {
    const sortColumn = sort === "usage" ? "usage_count" : "kill_count"

    const results = await clickhouse.query({
        format: "JSON",
        query_params: {
            sortColumn
        },
        query: `WITH
                    week_start AS (
                        -- Determine the start of the week based on Tuesday at 17:00 UTC
                        SELECT toStartOfWeek(now()) + INTERVAL 65 HOUR AS week_start
                    ),
                    this_week_instances AS (
                        SELECT *
                        FROM instance
                        WHERE date_completed >= (SELECT week_start FROM week_start)
                        AND date_completed < (SELECT week_start FROM week_start) + INTERVAL 1 WEEK
                    ),
                    weapon_usage AS (
                        SELECT
                            w.weapon_hash AS weapon_hash,
                            COUNT(*) AS usage_count,
                            SUM(w.kills) AS kill_count
                        FROM this_week_instances AS i
                        ARRAY JOIN i.players AS p
                        ARRAY JOIN p.characters AS c
                        ARRAY JOIN c.weapons AS w
                        GROUP BY w.weapon_hash
                        HAVING usage_count >= 100
                    )
                SELECT
                    wd.hash::Int64 AS hash,
                    wd.name,
                    wd.icon_path AS iconPath,
                    wd.element,
                    wd.slot,
                    wd.ammo_type AS ammoType,
                    wd.rarity,
                    wu.usage_count::Int AS usageCount,
                    wu.kill_count::Int AS killCount
                FROM weapon_usage AS wu
                INNER JOIN weapon_definition AS wd
                ON wu.weapon_hash = wd.hash
                ORDER BY wu.{sortColumn:Identifier} DESC;
                `
    })

    return await results
        .json<{
            hash: bigint
            name: string
            iconPath: string
            element: WeaponElement
            slot: WeaponSlot
            ammoType: WeaponAmmoType
            rarity: WeaponRarity
            usageCount: number
            killCount: number
        }>()
        .then(json =>
            json.data.map<WeaponMetric>(({ usageCount, killCount, ...weapon }) => ({
                weapon,
                usageCount,
                killCount
            }))
        )
}
