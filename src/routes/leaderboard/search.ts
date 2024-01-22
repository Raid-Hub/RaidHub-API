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
                    page: Math.ceil(results.position / req.query.count),
                    rank: results.rank,
                    position: results.position,
                    entries: results.entries
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
    const memberPlacement = await prisma.individualLeaderboardClears.findUnique({
        where: {
            uniqueRaidMembershipId: {
                membershipId: query.membershipId,
                raidId: query.raid
            }
        }
    })

    if (!memberPlacement) return null

    const entries = await prisma.individualLeaderboardClears.findMany({
        where: {
            raidId: query.raid,
            position: {
                gt: (Math.ceil(memberPlacement.position / query.count) - 1) * query.count,
                lte: Math.ceil(memberPlacement.position / query.count) * query.count
            }
        },
        select: {
            position: true,
            rank: true,
            value: true,
            player: {
                select: {
                    membershipId: true,
                    membershipType: true,
                    iconPath: true,
                    displayName: true,
                    bungieGlobalDisplayName: true,
                    bungieGlobalDisplayNameCode: true
                }
            }
        }
    })

    return { entries, rank: memberPlacement.rank, position: memberPlacement.position }
}
