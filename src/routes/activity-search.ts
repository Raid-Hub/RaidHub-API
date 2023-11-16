import { Router } from "express"
import { booleanString, includedIn, numberString, success } from "~/util"
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
        minDate: z.coerce.date().optional(),
        maxDate: z.coerce.date().optional(),
        minSeason: z.coerce.number().int().nonnegative().default(1),
        maxSeason: z.coerce.number().int().nonnegative().default(50),
        fresh: booleanString.optional(),
        completed: booleanString.optional(),
        flawless: booleanString.optional(),
        raid: z.coerce
            .number()
            .int()
            .refine(n => includedIn(ListedRaids, n))
            .optional(),
        platformType: z.coerce.number().int().positive().optional(),
        reversed: z.coerce.boolean().default(false),
        count: z.coerce.number().int().positive().default(25),
        page: z.coerce.number().int().positive().default(1)
    })
    .strict()
    .transform(({ membershipId, raid, ...q }) => ({
        membershipIds: membershipId,
        raid: raid as ListedRaid | undefined,
        ...q
    }))

// Todo: add a query param for the difficulty
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
    minDate,
    maxDate,
    raid,
    platformType,
    fresh,
    completed,
    flawless,
    reversed,
    count,
    page
}: z.infer<typeof activitySearchQuerySchema>) {
    // @ts-ignore
    const hashes = RaidHashes[raid] ? (Object.values(RaidHashes[raid]).flat() as string[]) : []
    const minSeasonDate = SeasonDates[minSeason] ?? SeasonDates[0]
    // do plus once because the season dates are the start dates
    const maxSeasonDate = SeasonDates[maxSeason + 1] ?? new Date(2000000000000)

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
                (${fresh}::boolean IS NULL OR a.fresh = ${fresh}) AND
                (${completed}::boolean IS NULL OR a.completed = ${completed}) AND
                (${flawless}::boolean IS NULL  OR a.flawless = ${flawless}) AND   
                (${hashes.length} = 0 OR a.raid_hash = ANY(${hashes}::bigint[])) AND
                (${platformType}::int IS NULL OR a.platform_type = ${platformType}) AND
                a.player_count BETWEEN ${minPlayers} AND ${maxPlayers} AND
                a.date_completed BETWEEN ${minSeasonDate} AND ${maxSeasonDate} AND
                a.date_completed BETWEEN ${minDate ?? SeasonDates[0]} AND ${maxDate ?? new Date()}
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
        WHERE _match_count = ${membershipIds.length}
        ORDER BY
            CASE WHEN NOT ${reversed} THEN date_completed ELSE 'epoch'::timestamp END DESC,
            CASE WHEN ${reversed} THEN date_completed ELSE 'epoch'::timestamp END ASC
        OFFSET ${(page - 1) * count}
        LIMIT ${count};`

    return results
}
