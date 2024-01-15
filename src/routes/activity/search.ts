import { includedIn, success } from "util/helpers"
import { prisma } from "~/prisma"
import { z } from "zod"
import { type ListedRaid, ListedRaids, RaidHashes } from "~/data/raids"
import { SeasonDates } from "~/data/seasonDates"
import { Prisma } from "@prisma/client"
import { isContest, isDayOne } from "~/data/raceDates"
import { cacheControl } from "~/middlewares/cache-control"
import { RaidHubRoute } from "route"
import { zBigIntString, zBooleanString } from "util/zod-common"

// Todo: add a query param for the difficulty
const activitySearchQuerySchema = z
    .object({
        membershipId: z.array(zBigIntString()).min(1),
        minPlayers: z.coerce.number().int().nonnegative().optional(),
        maxPlayers: z.coerce.number().int().nonnegative().optional(),
        minDate: z.coerce.date().optional(),
        maxDate: z.coerce.date().optional(),
        minSeason: z.coerce.number().int().nonnegative().optional(),
        maxSeason: z.coerce.number().int().nonnegative().optional(),
        fresh: zBooleanString().optional(),
        completed: zBooleanString().optional(),
        flawless: zBooleanString().optional(),
        raid: z.coerce
            .number()
            .int()
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

export const activitySearchRoute = new RaidHubRoute({
    path: "/search",
    method: "get",
    middlewares: [cacheControl(30)],
    query: activitySearchQuerySchema,
    async handler(req, res, next) {
        try {
            const activities = await searchActivities(req.query)
            const results = activities.map(a => ({
                instanceId: a.instance_id,
                raidHash: a.raid_hash,
                fresh: a.fresh,
                completed: a.completed,
                flawless: a.flawless,
                playerCount: a.player_count,
                dateStarted: a.date_started,
                dateCompleted: a.date_completed,
                platformType: a.platform_type,
                dayOne: isDayOne(a.raid_id, a.date_completed),
                contest: isContest(a.raid_id, a.date_started)
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
    }
})

type ActivitySearchResult = {
    instance_id: string
    raid_id: ListedRaid
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
    const hashes =
        raid && RaidHashes[raid] ? (Object.values(RaidHashes[raid]).flat() as string[]) : []
    const minSeasonDate = minSeason ? SeasonDates[minSeason - 1] ?? SeasonDates[0] : SeasonDates[0]
    // do plus once because the season dates are the start dates
    const maxSeasonDate = maxSeason
        ? SeasonDates[maxSeason] ?? new Date(2000000000000)
        : new Date(2000000000000)

    const results = await prisma.$queryRaw<Array<ActivitySearchResult>>`
        WITH activities_union AS (
            SELECT
                a.*,
                rd.raid_id,
                COUNT(pa.membership_id)::int AS _match_count
            FROM
                activity a
            JOIN
                player_activity pa ON a.instance_id = pa.instance_id
                AND pa.membership_id IN (${Prisma.join(membershipIds)})
            JOIN
                raid_definition rd ON a.raid_hash = rd.hash
            WHERE
                ${
                    fresh !== undefined
                        ? Prisma.sql`a.fresh = ${fresh}::boolean AND `
                        : Prisma.empty
                }${
                    completed !== undefined
                        ? Prisma.sql`a.completed = ${completed}::boolean AND`
                        : Prisma.empty
                }
                ${
                    flawless !== undefined
                        ? Prisma.sql`a.flawless = ${flawless}::boolean AND`
                        : Prisma.empty
                }
                ${
                    hashes.length
                        ? Prisma.sql`a.raid_hash IN (${Prisma.join(hashes.map(BigInt))}) AND`
                        : Prisma.empty
                }
                ${
                    platformType !== undefined
                        ? Prisma.sql`WHERE a.platform_type = ${platformType}::int AND`
                        : Prisma.empty
                }
                a.player_count BETWEEN ${minPlayers ?? 1} AND ${maxPlayers ?? 16384} AND
                a.date_completed BETWEEN ${minSeasonDate}::timestamp AND ${maxSeasonDate}::timestamp AND
                a.date_completed BETWEEN ${minDate ?? SeasonDates[0]}::timestamp AND ${
                    maxDate ?? new Date()
                }::timestamp
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
        WHERE _match_count = ${new Set(membershipIds).size}::int
        ORDER BY
            CASE WHEN NOT ${reversed}::boolean THEN date_completed ELSE 'epoch'::timestamp END DESC,
            CASE WHEN ${reversed}::boolean THEN date_completed ELSE 'epoch'::timestamp END ASC
        OFFSET ${(page - 1) * count}::int
        LIMIT ${count}::int;`

    return results
}
