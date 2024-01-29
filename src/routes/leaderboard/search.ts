import { RaidHubRoute } from "../../RaidHubRoute"
import {
    GlobalBoard,
    GlobalBoards,
    IndividualBoard,
    IndividualBoards,
    WorldFirstBoard,
    WorldFirstBoards,
    WorldFirstBoardsMap
} from "../../data/leaderboards"
import { ListedRaid } from "../../data/raids"
import { cacheControl } from "../../middlewares/cache-control"
import { ErrorCode, zRaidEnum } from "../../schema/common"
import { z, zBigIntString, zCount } from "../../schema/zod"
import { prisma } from "../../services/prisma"
import { fail, ok } from "../../util/response"
import {
    GlobalBoardPositionKeys,
    IndividualBoardPositionKeys,
    getGlobalLeaderboardEntries,
    getIndividualLeaderboardEntries,
    getWorldFirstLeaderboardEntries
} from "./_common"
import { zIndividualLeaderboardEntry, zWorldFirstLeaderboardEntry } from "./_schema"

const CommonQueryParams = z.object({
    membershipId: zBigIntString(),
    count: zCount({ def: 25, min: 5, max: 100 })
})

const SearchQuery = z.discriminatedUnion("type", [
    CommonQueryParams.extend({
        type: z.literal("worldfirst"),
        category: z.enum(WorldFirstBoards),
        raid: z.coerce.number().pipe(zRaidEnum)
    }),
    CommonQueryParams.extend({
        type: z.literal("individual"),
        category: z.enum(IndividualBoards),
        raid: z.coerce.number().pipe(zRaidEnum)
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
                    return fail(
                        { notFound: true, params: req.query },
                        ErrorCode.PlayerNotFoundError
                    )

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
                    return fail(
                        { notFound: true, params: req.query },
                        ErrorCode.PlayerNotFoundError
                    )

                return ok({
                    params: req.query,
                    page: Math.ceil(wfResults.position / req.query.count),
                    rank: wfResults.rank,
                    position: wfResults.position,
                    entries: wfResults.entries
                })
            case "global":
                const globalResults = await searchGlobalLeaderboard(req.query)
                if (!globalResults)
                    return fail(
                        { notFound: true, params: req.query },
                        ErrorCode.PlayerNotFoundError
                    )

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
        success: {
            statusCode: 200,
            schema: z
                .object({
                    params: CommonQueryParams.extend({
                        type: z.string(),
                        category: z.string(),
                        raid: zRaidEnum.optional()
                    }).strict(),
                    page: z.number().positive().int(),
                    rank: z.number().positive().int(),
                    position: z.number().positive().int(),
                    entries: z.array(
                        z.union([zIndividualLeaderboardEntry, zWorldFirstLeaderboardEntry])
                    )
                })
                .strict()
        },
        errors: [
            {
                statusCode: 404,
                type: ErrorCode.PlayerNotFoundError,
                schema: z
                    .object({
                        notFound: z.literal(true),
                        params: CommonQueryParams.extend({
                            type: z.string(),
                            category: z.string(),
                            raid: zRaidEnum.optional()
                        }).strict()
                    })
                    .strict()
            }
        ]
    }
})

async function searchIndividualLeaderboard(query: {
    count: number
    membershipId: bigint
    raid: ListedRaid
    category: IndividualBoard
}) {
    const memberPlacement = await prisma.individualLeaderboard.findUnique({
        where: {
            uniqueRaidMembershipId: {
                membershipId: query.membershipId,
                raidId: query.raid
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
    raid: ListedRaid
    category: WorldFirstBoard
}) {
    const type = WorldFirstBoardsMap[query.category]
    const memberPlacements = await prisma.playerActivity.findMany({
        where: {
            membershipId: query.membershipId,
            activity: {
                activityLeaderboardEntry: {
                    some: {
                        leaderboard: {
                            type: type,
                            raidId: query.raid
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
        raidId: query.raid,
        type: type,
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

async function searchGlobalLeaderboard(query: {
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
