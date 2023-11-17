import { Router } from "express"
import { booleanString, includedIn, numberString, success } from "~/util"
import { prisma } from "~/prisma"
import { zodQueryParser } from "~/middlewares/parsers"
import { z } from "zod"
import { type ListedRaid, ListedRaids, RaidHashes } from "~/data/raids"
import { SeasonDates } from "~/data/seasonDates"
import { cacheControl } from "~/middlewares/cache-control"

export const activitySearchRouter = Router()

activitySearchRouter.use(cacheControl(30))

const activitySearchQuerySchema = z
    .object({
        membershipId: z.union([z.array(numberString).min(1), numberString.transform(s => [s])]),
        minPlayers: z.coerce.number().int().nonnegative().optional(),
        maxPlayers: z.coerce.number().int().nonnegative().optional(),
        minDate: z.coerce.date().optional(),
        maxDate: z.coerce.date().optional(),
        minSeason: z.coerce.number().int().nonnegative().optional(),
        maxSeason: z.coerce.number().int().nonnegative().optional(),
        fresh: booleanString.optional(),
        completed: booleanString.optional(),
        flawless: booleanString.optional(),
        raid: z.coerce
            .number()
            .int()
            .positive()
            .refine(n => includedIn(ListedRaids, n), {
                message: "invalid raid value"
            })
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
activitySearchRouter.get("/", zodQueryParser(activitySearchQuerySchema), async (req, res, next) => {
    try {
        const activities = await searchActivities(req.query)
        const results = activities.map(a => ({
            instanceId: a.instance_id,
            raidHash: a.raid_hash,
            false: a.fresh,
            completed: a.completed,
            flawless: a.flawless,
            playerCount: a.player_count,
            dateStarted: a.date_started,
            dateCompleted: a.date_completed,
            platformType: a.platform_type
        }))
        res.status(200).json(
            success({
                query: req.query,
                results
            })
        )
    } catch (e) {
        next(e)
    }
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
    const minSeasonDate = minSeason ? SeasonDates[minSeason] ?? SeasonDates[0] : SeasonDates[0]
    // do plus once because the season dates are the start dates
    const maxSeasonDate = maxSeason
        ? SeasonDates[maxSeason + 1] ?? new Date(2000000000000)
        : new Date(2000000000000)

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
                (${flawless}::boolean IS NULL OR a.flawless = ${flawless}) AND   
                (${hashes.length} = 0 OR a.raid_hash = ANY(${hashes}::bigint[])) AND
                (${platformType}::int IS NULL OR a.platform_type = ${platformType}) AND
                a.player_count BETWEEN ${minPlayers ?? 1} AND ${maxPlayers ?? 16384} AND
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
