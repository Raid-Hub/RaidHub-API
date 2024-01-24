import { string, z } from "zod"
import { RaidHubRoute, fail, ok } from "../../RaidHubRoute"
import { zBigIntString } from "../../util/zod-common"
import { cacheControl } from "../../middlewares/cache-control"
import {
    RaidPath,
    zIndividualLeaderboardEntry,
    zRaidSchema,
    zWorldFirstLeaderboardEntry
} from "./_schema"
import { prisma } from "../../prisma"
import {
    GlobalBoard,
    GlobalBoards,
    IndividualBoard,
    IndividualBoards,
    UrlPathsToRaid,
    WorldFirstBoards,
    WorldFirstBoardsMap
} from "../../data/leaderboards"
import { IndividualLeaderboard, WorldFirstLeaderboardType } from "@prisma/client"
import {
    GlobalBoardPositionKeys,
    IndividualBoardPositionKeys,
    getGlobalLeaderboardEntries,
    getIndividualLeaderboardEntries,
    getWorldFirstLeaderboardEntries
} from "./_common"

const CommonQueryParams = z.object({
    membershipId: zBigIntString(),
    count: z.coerce.number()
})

const SearchQuery = z.discriminatedUnion("type", [
    CommonQueryParams.extend({
        type: z.literal("worldfirst"),
        category: z.enum(WorldFirstBoards).transform(v => WorldFirstBoardsMap[v]),
        raid: zRaidSchema
    }),
    CommonQueryParams.extend({
        type: z.literal("individual"),
        category: z.enum(IndividualBoards),
        raid: zRaidSchema
    }),
    CommonQueryParams.extend({
        type: z.literal("global"),
        category: z.enum(GlobalBoards)
    })
])

export const leaderboardSearchRoute = new RaidHubRoute({
    method: "get",
    query: SearchQuery,
    middlewares: [cacheControl(30)],
    async handler(req) {
        switch (req.query.type) {
            case "individual":
                const individualResults = await searchIndividualLeaderboard(req.query)
                if (!individualResults)
                    return fail({ notFound: true, params: req.query }, 404, "Player not found")

                return ok({
                    params: req.query,
                    page: Math.ceil(individualResults.position / req.query.count),
                    rank: individualResults.rank,
                    position: individualResults.position,
                    entries: individualResults.entries
                })
            case "worldfirst":
                const wfResults = await searchWorldFirstLeaderboard(req.query)
                if (!wfResults)
                    return fail({ notFound: true, params: req.query }, 404, "Player not found")

                return ok({
                    params: req.query,
                    page: Math.ceil(wfResults.position / req.query.count),
                    rank: wfResults.rank,
                    position: wfResults.position,
                    entries: wfResults.entries
                })
            case "global":
                const globalResults = await searchGloballLeaderboard(req.query)
                if (!globalResults)
                    return fail({ notFound: true, params: req.query }, 404, "Player not found")

                return ok({
                    params: req.query,
                    page: Math.ceil(globalResults.position / req.query.count),
                    rank: globalResults.rank,
                    position: globalResults.position,
                    entries: globalResults.entries
                })
        }
    },
    response: {
        success: z
            .object({
                params: CommonQueryParams.extend({
                    type: z.string(),
                    category: string(),
                    raid: zRaidSchema.optional()
                }).strict(),
                page: z.number().positive().int(),
                rank: z.number().positive().int(),
                position: z.number().positive().int(),
                entries: z.array(
                    z.union([zIndividualLeaderboardEntry, zWorldFirstLeaderboardEntry])
                )
            })
            .strict(),
        error: z
            .object({
                notFound: z.boolean(),
                params: CommonQueryParams.extend({
                    type: z.string(),
                    category: string(),
                    raid: zRaidSchema.optional()
                }).strict()
            })
            .strict()
    }
})

async function searchIndividualLeaderboard(query: {
    count: number
    membershipId: bigint
    raid: RaidPath
    category: IndividualBoard
}) {
    const memberPlacement = await prisma.individualLeaderboard.findUnique({
        where: {
            uniqueRaidMembershipId: {
                membershipId: query.membershipId,
                raidId: UrlPathsToRaid[query.raid]
            }
        }
    })

    if (!memberPlacement) return null

    const key = IndividualBoardPositionKeys[query.category]

    const entries = await getIndividualLeaderboardEntries({
        category: query.category,
        raid: query.raid,
        page: Math.ceil(memberPlacement[key.position] / query.count),
        count: query.count
    })

    return {
        entries,
        rank: memberPlacement[key.rank],
        position: memberPlacement[key.position]
    }
}

async function searchWorldFirstLeaderboard(query: {
    count: number
    membershipId: bigint
    raid: RaidPath
    category: WorldFirstLeaderboardType
}) {
    const raidId = UrlPathsToRaid[query.raid]
    const memberPlacements = await prisma.playerActivity.findMany({
        where: {
            membershipId: query.membershipId,
            activity: {
                activityLeaderboardEntry: {
                    some: {
                        leaderboard: {
                            type: query.category,
                            raidId: raidId
                        }
                    }
                }
            }
        },
        select: {
            activity: {
                select: {
                    activityLeaderboardEntry: {
                        orderBy: {
                            rank: "asc"
                        },
                        take: 1
                    }
                }
            }
        }
    })

    if (!memberPlacements.length) return null

    const placements = memberPlacements
        .map(({ activity }) => activity.activityLeaderboardEntry[0])
        .sort((a, b) => a.rank - b.rank)

    const leaderboard = await getWorldFirstLeaderboardEntries({
        raidId,
        type: query.category,
        page: Math.ceil(placements[0].rank / query.count),
        count: query.count
    })
    if (!leaderboard) return null

    return {
        entries: leaderboard.entries,
        rank: placements[0].rank,
        position: placements[0].position
    }
}

async function searchGloballLeaderboard(query: {
    count: number
    membershipId: bigint
    category: GlobalBoard
}) {
    const memberPlacement = await prisma.globalLeaderboard.findUnique({
        where: {
            membershipId: query.membershipId
        }
    })

    if (!memberPlacement) return null

    const key = GlobalBoardPositionKeys[query.category]

    const entries = await getGlobalLeaderboardEntries({
        category: query.category,
        page: Math.ceil(memberPlacement[key.position] / query.count),
        count: query.count
    })

    return {
        entries,
        rank: memberPlacement[key.rank],
        position: memberPlacement[key.position]
    }
}
