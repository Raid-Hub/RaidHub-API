import { adminQueryRoute } from "./query"

describe("admin query 200", () => {
    const t = async (query: string) => {
        const result = await adminQueryRoute.$mock({ body: { query } })
        expect(result.type).toBe("ok")
    }

    test("SELECT 1", () => t("SELECT 1"))

    test("EXPLAIN", () => t("EXPLAIN SELECT * FROM activity;"))

    test("SELECT * ", () => t("SELECT * FROM player_activity LIMIT 10;"))

    test(
        "Complex",
        () =>
            t(`
    SELECT 
        DENSE_RANK() OVER (ORDER BY date_completed ASC) AS rank,
        players_concatenated[1] AS player1,
        players_concatenated[2] AS player2,
        date_completed,
        EXTRACT(EPOCH FROM date_completed - first_value(date_completed) OVER (ORDER BY date_completed ASC)) AS time_after_first_completion_seconds
    FROM (
        SELECT 
            ARRAY_AGG(p.bungie_global_display_name ORDER BY p.bungie_global_display_name) AS players_concatenated,
            a.date_completed
        FROM 
            activity a 
        JOIN 
            player_activity pa ON a.instance_id = pa.instance_id
        JOIN 
            raid_definition rd ON rd.hash = a.raid_hash
        JOIN 
            player p ON p.membership_id = pa.membership_id
        WHERE 
            a.player_count = 2 AND a.flawless AND rd.raid_id = 13 
        GROUP BY 
            a.instance_id, a.date_completed
    ) AS subquery
    ORDER BY 
        date_completed ASC
    LIMIT 3;`),
        30000
    )
})

describe("admin query 500", () => {
    const t = (query: string) => () => adminQueryRoute.$mock({ body: { query } })

    test("Bad table", () => {
        const f = t("SELECT * from fasdhfahfuiasdf")
        expect(f).rejects.toThrow()
    })

    test("Bad syntax", () => {
        const f = t("SELECT * FROM activity LIMIT 10 WHERE 1 = 1;")
        expect(f).rejects.toThrow()
    })
})
