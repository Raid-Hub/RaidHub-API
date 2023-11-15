import { Router } from "express"
import { includedIn, numberString, success } from "~/util"
import { prisma } from "~/prisma"
import { zodQueryParser } from "~/middlewares/parsers"
import { z } from "zod"
import { type ListedRaid, ListedRaids, RaidHashes } from "~/data/raids"
import { SeasonDates } from "~/data/seasonDates"

export const activitySearchRouter = Router()

const activitySearchQuerySchema = z
    .object({
        membershipId: z
            .union([z.array(numberString), numberString.transform(s => [s])])
            .default([]),
        minPlayers: z.coerce.number().int().nonnegative().default(1),
        maxPlayers: z.coerce.number().int().nonnegative().default(16384),
        minSeason: z.coerce.number().int().nonnegative().default(1),
        maxSeason: z.coerce.number().int().nonnegative().default(50),
        raid: z.coerce
            .number()
            .int()
            .refine(n => includedIn(ListedRaids, n))
            .optional(),
        platformType: z.coerce.number().int().positive().optional(),
        reversed: z
            .string()
            .optional()
            .transform(s => s?.toLowerCase() == "true"),
        count: z.coerce.number().int().positive().default(25),
        page: z.coerce.number().int().positive().default(1)
    })
    .transform(({ membershipId, platformType, raid, ...q }) => ({
        membershipIds: membershipId,
        platformType: platformType ?? -1,
        raid: raid as ListedRaid | undefined,
        ...q
    }))

activitySearchRouter.get("/", zodQueryParser(activitySearchQuerySchema), async (req, res) => {
    const activities = await searchActivities(req.query)
    res.status(200).json(
        success({
            query: req.query,
            results: activities
        })
    )
})

type ActivitySearchResult = {
    instance_id: string
    raid_hash: string
    fresh: boolean
    completed: boolean
    flawless: boolean
    player_count: number
    date_started: Date
    date_completed: Date
    platform_type: number
}

async function searchActivities({
    membershipIds,
    minPlayers,
    maxPlayers,
    minSeason,
    maxSeason,
    raid,
    platformType,
    reversed,
    count,
    page
}: z.infer<typeof activitySearchQuerySchema>) {
    // @ts-ignore
    const hashes = RaidHashes[raid] ? (Object.values(RaidHashes[raid]).flat() as string[]) : []
    const minDate = SeasonDates[minSeason] ?? new Date(0)
    const maxDate = SeasonDates[maxSeason] ?? new Date(2000000000000)

    console.log({
        membershipIds,
        minPlayers,
        maxPlayers,
        minSeason,
        maxSeason,
        raid,
        platformType,
        reversed,
        count,
        page
    })

    const results = await prisma.$queryRaw<Array<ActivitySearchResult>>`
        WITH activities_union AS (
            SELECT
                a.*,
                COUNT(pa.membership_id)::int AS _match_count
            FROM
                activity a
            JOIN
                player_activity pa ON a.instance_id = pa.instance_id
                AND pa.membership_id = ANY(${membershipIds}::bigint[])
            WHERE
                a.player_count BETWEEN ${minPlayers} AND ${maxPlayers} AND
                a.date_completed BETWEEN ${minDate} AND ${maxDate} AND
                (cardinality(${hashes}::bigint[]) = 0 OR a.raid_hash = ANY(${hashes}::bigint[])) AND
                (${platformType} = -1 OR a.platform_type = ${platformType})
            GROUP BY
                a.instance_id
        )
        SELECT
            instance_id::text,
            raid_hash::text,
            fresh,
            completed,
            flawless,
            player_count,
            date_started,
            date_completed,
            platform_type
        FROM activities_union
        WHERE _match_count = cardinality(${membershipIds}::bigint[])
        ORDER BY
            CASE WHEN NOT ${reversed} THEN date_completed ELSE 'epoch'::timestamp END DESC,
            CASE WHEN ${reversed} THEN date_completed ELSE 'epoch'::timestamp END ASC
        OFFSET ${(page - 1) * count}
        LIMIT ${count};`

    return results
}

// ORDER BY
// CASE WHEN NOT ${reversed} THEN a.date_completed ELSE 'epoch'::timestamp END DESC,
// CASE WHEN ${reversed} THEN a.date_completed ELSE 'epoch'::timestamp END ASC
// OFFSET ${(page - 1) * count}
// LIMIT ${count}
