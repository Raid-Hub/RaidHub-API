import { z } from "zod"
import { RaidHubRoute, fail, ok } from "../../RaidHubRoute"
import { zBigIntString } from "../../util/zod-common"
import { cacheControl } from "../../middlewares/cache-control"
import { zRaidSchema } from "./_schema"
import { prisma } from "../../prisma"
import {
    IndividualBoard,
    IndividualBoards,
    WorldFirstBoards,
    WorldFirstBoardsMap
} from "../../data/leaderboards"
import { IndividualLeaderboard, WorldFirstLeaderboardType } from "@prisma/client"

const CommonQueryParams = z.object({
    membershipId: zBigIntString(),
    count: z.coerce.number()
})

export const leaderboardSearchRoute = new RaidHubRoute({
    method: "get",
    query: z.discriminatedUnion("type", [
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
            type: z.literal("global")
        })
    ]),
    middlewares: [cacheControl(30)],
    async handler(req) {
        switch (req.query.type) {
            case "individual":
                const individualResults = await searchIndividualLeaderboard(req.query)
                if (!individualResults) return fail({ notFound: true }, 404, "Player not found")
                return ok({
                    params: req.query,
                    page: Math.ceil(individualResults.position / req.query.count),
                    rank: individualResults.rank,
                    position: individualResults.position,
                    entries: individualResults.entries
                })
            case "worldfirst":
                const wfResults = await searchWorldFirstLeaderboard(req.query)
                if (!wfResults) return fail({ notFound: true }, 404, "Player not found")
                return ok({
                    params: req.query,
                    page: Math.ceil(wfResults.position / req.query.count),
                    rank: wfResults.rank,
                    position: wfResults.position,
                    entries: wfResults.entries
                })
            case "global":
                return ok({})
        }
    },
    response: {
        success: z.object({}).strict()
    }
})

const IndividualBoardPositionKeys = {
    clears: {
        rank: "clearsRank",
        position: "clearsPosition",
        value: "clears"
    },
    fresh: {
        rank: "fullClearsRank",
        position: "fullClearsPosition",
        value: "fullClears"
    },
    sherpas: {
        rank: "sherpasRank",
        position: "sherpasPosition",
        value: "sherpas"
    },
    trios: {
        rank: "triosRank",
        position: "triosPosition",
        value: "trios"
    },
    duos: {
        rank: "duosRank",
        position: "duosPosition",
        value: "duos"
    },
    solos: {
        rank: "solosRank",
        position: "solosPosition",
        value: "solos"
    }
} as const satisfies Record<
    IndividualBoard,
    {
        rank: keyof IndividualLeaderboard
        position: keyof IndividualLeaderboard
        value: keyof IndividualLeaderboard
    }
>

async function searchIndividualLeaderboard(query: {
    count: number
    membershipId: bigint
    raid: number
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

    const entries = await prisma.individualLeaderboard.findMany({
        where: {
            raidId: query.raid,
            [key.position]: {
                gt: (Math.ceil(memberPlacement[key.position] / query.count) - 1) * query.count,
                lte: Math.ceil(memberPlacement[key.position] / query.count) * query.count
            }
        },
        include: {
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
        },
        orderBy: {
            [key.position]: "asc"
        }
    })

    return {
        entries: entries.map(({ player: { ...player }, ...entry }) => ({
            position: entry[key.position],
            rank: entry[key.rank],
            value: entry[key.value],
            player
        })),
        rank: memberPlacement[key.rank],
        position: memberPlacement[key.position]
    }
}

async function searchWorldFirstLeaderboard(query: {
    count: number
    membershipId: bigint
    raid: number
    category: WorldFirstLeaderboardType
}) {
    const memberPlacement = await prisma.playerActivity.findMany({
        where: {
            membershipId: query.membershipId,
            activity: {
                activityLeaderboardEntry: {
                    some: {
                        leaderboard: {
                            type: query.category,
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

    if (!memberPlacement) return null

    const placement = memberPlacement
        .map(({ activity }) => activity.activityLeaderboardEntry[0])
        .sort((a, b) => a.rank - b.rank)[0]

    const entries = await prisma.activityLeaderboard.findUnique({
        where: {
            raidId_type: {
                raidId: query.raid,
                type: query.category
            }
        },
        select: {
            date: true,
            entries: {
                where: {
                    rank: {
                        gt: (Math.ceil(placement.rank / query.count) - 1) * query.count,
                        lte: Math.ceil(placement.rank / query.count) * query.count
                    }
                },
                include: {
                    activity: {
                        select: {
                            instanceId: true,
                            raidHash: true,
                            dateStarted: true,
                            dateCompleted: true,
                            playerActivity: {
                                select: {
                                    finishedRaid: true,
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
                            }
                        }
                    }
                }
            }
        }
    })

    if (!entries) return null

    return {
        entries: entries.entries.map(e => ({
            position: e.position,
            rank: e.rank,
            value: (e.activity.dateCompleted.getTime() - entries.date.getTime()) / 1000,
            players: e.activity.playerActivity.map(({ player, finishedRaid }) => ({
                ...player,
                finishedRaid
            }))
        })),
        rank: placement.rank,
        position: placement.position
    }
}
