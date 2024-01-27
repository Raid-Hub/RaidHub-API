import { Prisma } from "@prisma/client"
import { BungieMembershipType } from "bungie-net-core/models"
import { RaidHubRoute } from "../../RaidHubRoute"
import { isContest, isDayOne } from "../../data/raceDates"
import { RaidHashes, type ListedRaid } from "../../data/raids"
import { SeasonDates } from "../../data/seasonDates"
import { cacheControl } from "../../middlewares/cache-control"
import { zActivityExtended, zRaidEnum } from "../../schema/common"
import { z, zBigIntString, zBooleanString } from "../../schema/zod"
import { prisma } from "../../services/prisma"
import { ok } from "../../util/response"

// Todo: add a query param for the difficulty
export const activitySearchQuerySchema = z
    .object({
        membershipId: z
            .union([zBigIntString().transform(m => [m]), z.array(zBigIntString())])
            .pipe(z.array(zBigIntString()).min(1)),
        minPlayers: z.coerce.number().int().nonnegative().optional(),
        maxPlayers: z.coerce.number().int().nonnegative().optional(),
        minDate: z.coerce.date().optional(),
        maxDate: z.coerce.date().optional(),
        minSeason: z.coerce.number().int().nonnegative().optional(),
        maxSeason: z.coerce.number().int().nonnegative().optional(),
        fresh: zBooleanString().optional(),
        completed: zBooleanString().optional(),
        flawless: zBooleanString().optional(),
        raid: zRaidEnum.optional(),
        platformType: z.coerce.number().int().positive().optional(),
        reversed: z.coerce.boolean().default(false),
        count: z.coerce.number().int().positive().default(25),
        page: z.coerce.number().int().positive().default(1)
    })
    .strip()

export const activitySearchRoute = new RaidHubRoute({
    method: "get",
    middlewares: [cacheControl(30)],
    query: activitySearchQuerySchema,
    async handler(req) {
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
            platformType: a.platform_type as BungieMembershipType,
            duration: a.duration,
            dayOne: isDayOne(a.raid_id, a.date_completed),
            contest: isContest(a.raid_id, a.date_started),
            weekOne: isContest(a.raid_id, a.date_completed)
        }))

        return ok({
            query: req.query,
            results
        })
    },
    response: {
        success: z
            .object({
                query: activitySearchQuerySchema,
                results: z.array(zActivityExtended)
            })
            .strict()
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
    duration: number
}

async function searchActivities({
    membershipId: membershipIds,
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
                        ? Prisma.sql`a.platform_type = ${platformType}::int AND`
                        : Prisma.empty
                }
                a.player_count BETWEEN ${minPlayers ?? 1} AND ${maxPlayers ?? 16384} AND
                a.date_completed BETWEEN ${minSeasonDate}::timestamp AND ${maxSeasonDate}::timestamp AND
                a.date_completed BETWEEN ${minDate ?? SeasonDates[0]}::timestamp AND ${
                    maxDate ?? new Date()
                }::timestamp
            GROUP BY
                a.instance_id, 
                rd.raid_id
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
            duration,
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
