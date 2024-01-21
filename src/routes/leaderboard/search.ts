import { z } from "zod"
import { RaidHubRoute, fail, ok } from "../../RaidHubRoute"
import { zBigIntString } from "../../util/zod-common"
import { cacheControl } from "../../middlewares/cache-control"
import { zLeaderboardQueryPagination, zRaidSchema } from "./_schema"
import { prisma } from "../../prisma"
import { IndividualBoard, IndividualBoards } from "../../data/leaderboards"
import { Prisma } from "@prisma/client"
import { Sql } from "@prisma/client/runtime/library"

const CommonQueryParams = z.object({
    count: z.coerce.number(),
    membershipId: zBigIntString()
})

export const leaderboardSearchRoute = new RaidHubRoute({
    method: "get",
    query: z.discriminatedUnion("type", [
        CommonQueryParams.extend({
            type: z.literal("worldfirst")
        }),
        CommonQueryParams.extend({
            type: z.literal("individual"),
            raid: zRaidSchema,
            category: z.enum(IndividualBoards)
        }),
        CommonQueryParams.extend({
            type: z.literal("global")
        })
    ]),
    middlewares: [cacheControl(30)],
    async handler(req) {
        switch (req.query.type) {
            case "individual":
                const results = await searchIndividualLeaderboard(req.query)
                if (!results) return fail({ notFound: true }, 404, "Player not found")
                return ok({
                    params: req.query,
                    page: Math.floor(results.position / req.query.count) + 1,
                    position: results.position,
                    entries: results.rows
                })
        }
        return ok({})
    },
    response: {
        success: z.object({}).strict()
    }
})

const rawSql: Record<IndividualBoard, Sql> = {
    clears: Prisma.sql`player_stats.clears`,
    sherpas: Prisma.sql`player_stats.sherpas`,
    fresh: Prisma.sql`player_stats.fresh_clears`,
    trios: Prisma.sql`player_stats.trios`,
    duos: Prisma.sql`player_stats.duos`,
    solos: Prisma.sql`player_stats.solos`
}

async function searchIndividualLeaderboard(query: {
    count: number
    membershipId: bigint
    raid: number
    category: IndividualBoard
}) {
    const rows = await prisma.$queryRaw<Array<any>>`
        WITH users AS (
            SELECT
                *,
                RANK() OVER (ORDER BY ${rawSql[query.category]} DESC)::int AS rank,
                ROW_NUMBER() OVER (ORDER BY ${rawSql[query.category]} DESC)::int AS row_number
            FROM player_stats
            WHERE raid_id = ${query.raid}
            ORDER BY row_number ASC
        )
        SELECT *
        FROM users
        OFFSET (
            SELECT MIN((row_number / ${query.count}) * ${query.count})
            FROM users 
            WHERE membership_id = ${query.membershipId}::bigint
        )
        WHERE membership_id = ${query.membershipId}::bigint
        LIMIT 50;
    `

    if (!rows.length) return null

    return { rows, position: rows.find(r => r.membership_id === query.membershipId).rank }
}
