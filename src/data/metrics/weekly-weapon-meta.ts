import { WeaponMetric } from "../../schema/components/Metrics"
import {
    WeaponAmmoType,
    WeaponElement,
    WeaponRarity,
    WeaponSlot
} from "../../schema/components/Weapon"
import { clickhouse } from "../../services/clickhouse/client"

export const getWeeklyWeaponMeta = async ({
    sort,
    date
}: {
    sort: "usage" | "kills"
    date: Date
}) => {
    const sortColumn = sort === "usage" ? "usage_count" : "kill_count"
    // Determine the start of the week based on Tuesday at 17:00 UTC
    const weekStart = new Date(date)
    if (weekStart.getUTCDay() < 2 || (weekStart.getUTCDay() == 2 && weekStart.getUTCHours() < 17)) {
        weekStart.setUTCDate(weekStart.getUTCDate() - 7)
    }
    weekStart.setUTCHours(17, 0, 0, 0)
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay() + 2)

    const results = await clickhouse.query({
        format: "JSON",
        query_params: {
            sortColumn,
            date: weekStart
        },
        query: `WITH the_week AS (
                    SELECT 
                        {date:DateTime} AS week_start,
                        week_start + INTERVAL 1 WEEK AS week_end
                ),
                entries AS (
                    SELECT arrayJoin(flatten(arrayMap(p -> (arrayMap(c -> (
                        c.weapons
                    ), p.characters)), i.players))) AS weapon
                    FROM instance i FINAL
                    WHERE i.date_completed >= (SELECT week_start FROM the_week)
                    AND i.date_completed < (SELECT week_end FROM the_week) + INTERVAL 1 WEEK
                ),
                weapon_usage AS (
                    SELECT
                        e.weapon.weapon_hash as hash,
                        COUNT(*) AS usage_count,
                        SUM(e.weapon.kills) AS kill_count
                    FROM entries e
                    GROUP BY e.weapon.weapon_hash
                    HAVING usage_count >= 100
                )
                SELECT
                    wu.hash AS hash,
                    wd.name,
                    wd.icon_path,
                    wd.element,
                    wd.slot,
                    wd.ammo_type,
                    wd.rarity,
                    wu.usage_count,
                    wu.kill_count
                FROM weapon_usage AS wu
                LEFT JOIN weapon_definition AS wd
                ON wu.hash = wd.hash
                ORDER BY wu.{sortColumn:Identifier} DESC;`
    })

    const metrics = await results
        .json<{
            hash: number
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

    return {
        metrics,
        weekStart
    }
}
