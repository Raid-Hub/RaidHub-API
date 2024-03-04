import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
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
import { ErrorCode, registry, zRaidEnum } from "../../schema/common"
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

extendZodWithOpenApi(z)

const SearchQuery = registry.register(
    "LeaderboardSearchQuery",
    z.object({
        type: z.union([z.literal("worldfirst"), z.literal("individual"), z.literal("global")]),
        membershipId: zBigIntString(),
        count: zCount({ def: 25, min: 5, max: 100 }),
        category: z.union([
            z.enum(WorldFirstBoards),
            z.enum(IndividualBoards),
            z.enum(GlobalBoards)
        ]),
        raid: z.coerce.number().pipe(zRaidEnum).optional()
    })
)

export const leaderboardSearchRoute = new RaidHubRoute({
    method: "get",
    query: SearchQuery,
    middlewares: [cacheControl(30)],
    async handler(req) {
        switch (req.query.type) {
            case "global":
                const gCategory = z.enum(GlobalBoards).parse(req.query.category)
                const globalResults = await searchGlobalLeaderboard({
                    ...req.query,
                    category: gCategory
                })
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

            case "individual":
                const iCategory = z.enum(IndividualBoards).parse(req.query.category)
                if (!req.query.raid) {
                    return fail(
                        { notFound: true, params: req.query },
                        ErrorCode.LeaderboardNotFoundError
                    )
                }

                const individualResults = await searchIndividualLeaderboard({
                    ...req.query,
                    raid: req.query.raid!,
                    category: iCategory
                })
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
                const wfCategory = z.enum(WorldFirstBoards).parse(req.query.category)
                console.log({ wfCategory })
                if (!req.query.raid) {
                    return fail(
                        { notFound: true, params: req.query },
                        ErrorCode.LeaderboardNotFoundError
                    )
                }

                const wfResults = await searchWorldFirstLeaderboard({
                    ...req.query,
                    raid: req.query.raid!,
                    category: wfCategory
                })
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
        }
    },
    response: {
        success: {
            statusCode: 200,
            schema: z
                .object({
                    params: z
                        .object({
                            type: z.union([
                                z.literal("individual"),
                                z.literal("worldfirst"),
                                z.literal("global")
                            ]),
                            category: z.string(),
                            raid: zRaidEnum.optional(),
                            membershipId: zBigIntString(),
                            count: zCount({ def: 25, min: 5, max: 100 })
                        })
                        .strict(),
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
                        params: z
                            .object({
                                membershipId: zBigIntString(),
                                count: zCount({ def: 25, min: 5, max: 100 }),
                                type: z.union([
                                    z.literal("individual"),
                                    z.literal("worldfirst"),
                                    z.literal("global")
                                ]),
                                category: z.string(),
                                raid: zRaidEnum.optional()
                            })
                            .strict()
                    })
                    .strict()
            },
            {
                statusCode: 404,
                type: ErrorCode.LeaderboardNotFoundError,
                schema: z
                    .object({
                        notFound: z.literal(true),
                        params: z
                            .object({
                                membershipId: zBigIntString(),
                                count: zCount({ def: 25, min: 5, max: 100 }),
                                type: z.union([
                                    z.literal("individual"),
                                    z.literal("worldfirst"),
                                    z.literal("global")
                                ]),
                                category: z.string(),
                                raid: zRaidEnum.optional()
                            })
                            .strict()
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
    const type = WorldFirstBoardsMap.find(([board]) => board === query.category)![1]

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
                    },
                    playerActivity: {
                        select: {
                            membershipId: true,
                            finishedRaid: true
                        }
                    }
                }
            }
        }
    })

    if (!memberPlacements.length) return null

    const placements = memberPlacements
        .filter(
            ({ activity }) =>
                !!activity.playerActivity.find(p => p.membershipId === query.membershipId)
                    ?.finishedRaid
        )
        .map(({ activity }) => activity.activityLeaderboardEntry[0])
        .sort((a, b) => a.rank - b.rank)

    const leaderboard = (await getWorldFirstLeaderboardEntries({
        raidId: query.raid,
        type: type,
        page: Math.ceil(placements[0].rank / query.count),
        count: query.count
    }))! // we know this exists because we just got the placement

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
