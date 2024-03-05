import { GlobalLeaderboard, IndividualLeaderboard, WorldFirstLeaderboardType } from "@prisma/client"
import { GlobalBoard, IndividualBoard } from "../../data/leaderboards"
import { ListedRaid } from "../../data/raids"
import { prisma } from "../../services/prisma"

export const IndividualBoardPositionKeys = {
    total: {
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

export async function getIndividualLeaderboardEntries(params: {
    category: IndividualBoard
    raid: ListedRaid
    page: number
    count: number
}) {
    const key = IndividualBoardPositionKeys[params.category]

    const entries = await prisma.individualLeaderboard.findMany({
        where: {
            raidId: params.raid,
            [key.position]: {
                gt: (params.page - 1) * params.count,
                lte: params.page * params.count
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
                    bungieGlobalDisplayNameCode: true,
                    lastSeen: true
                }
            }
        },
        orderBy: {
            [key.position]: "asc"
        }
    })

    return entries.map(({ player, ...entry }) => ({
        position: entry[key.position],
        rank: entry[key.rank],
        value: entry[key.value],
        player
    }))
}

export async function getWorldFirstLeaderboardEntries(params: {
    raidId: number
    type: WorldFirstLeaderboardType
    page: number
    count: number
}) {
    const leaderboard = await prisma.activityLeaderboard.findUnique({
        where: {
            raidId_type: {
                raidId: params.raidId,
                type: params.type
            }
        },
        select: {
            date: true,
            entries: {
                take: params.count,
                where: {
                    rank: {
                        gt: (params.page - 1) * params.count,
                        lte: params.page * params.count
                    }
                },
                orderBy: {
                    position: "asc"
                },
                include: {
                    activity: {
                        include: {
                            playerActivity: {
                                select: {
                                    finishedRaid: true,
                                    kills: true,
                                    assists: true,
                                    deaths: true,
                                    timePlayedSeconds: true,
                                    classHash: true,
                                    sherpas: true,
                                    isFirstClear: true,
                                    player: {
                                        select: {
                                            membershipId: true,
                                            membershipType: true,
                                            iconPath: true,
                                            displayName: true,
                                            bungieGlobalDisplayName: true,
                                            bungieGlobalDisplayNameCode: true,
                                            lastSeen: true
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

    if (!leaderboard) return null

    return {
        date: leaderboard.date,
        entries: leaderboard.entries.map(
            ({ activity: { playerActivity, ...activity }, ...data }) => ({
                position: data.position,
                rank: data.rank,
                value: (activity.dateCompleted.getTime() - leaderboard.date.getTime()) / 1000,
                activity: activity,
                players: playerActivity.map(({ player, ...pa }) => ({
                    ...player,
                    data: pa
                }))
            })
        )
    }
}

type ValidKey = keyof GlobalLeaderboard & ("clears" | "fullClears" | "sherpas" | "speed")

export const GlobalBoardPositionKeys: Record<
    GlobalBoard,
    {
        rank: keyof GlobalLeaderboard & `${ValidKey}Rank`
        position: keyof GlobalLeaderboard & `${ValidKey}Position`
        value: ValidKey
    }
> = {
    "total-clears": {
        rank: "clearsRank",
        position: "clearsPosition",
        value: "clears"
    },
    "full-clears": {
        rank: "fullClearsRank",
        position: "fullClearsPosition",
        value: "fullClears"
    },
    sherpas: {
        rank: "sherpasRank",
        position: "sherpasPosition",
        value: "sherpas"
    },
    "cumulative-speedrun": {
        rank: "speedRank",
        position: "speedPosition",
        value: "speed"
    }
}

export async function getGlobalLeaderboardEntries(params: {
    category: GlobalBoard
    page: number
    count: number
}) {
    const key = GlobalBoardPositionKeys[params.category]

    const entries = await prisma.globalLeaderboard.findMany({
        where: {
            [key.position]: {
                gt: (params.page - 1) * params.count,
                lte: params.page * params.count
            },
            ...(params.category === "cumulative-speedrun"
                ? {
                      speed: {
                          not: null
                      }
                  }
                : {})
        },
        include: {
            player: {
                select: {
                    membershipId: true,
                    membershipType: true,
                    iconPath: true,
                    displayName: true,
                    bungieGlobalDisplayName: true,
                    bungieGlobalDisplayNameCode: true,
                    lastSeen: true
                }
            }
        },
        orderBy: {
            [key.position]: "asc"
        }
    })

    return entries.map(({ player, ...entry }) => ({
        position: entry[key.position],
        rank: entry[key.rank],
        value: entry[key.value]!, // non null assertion for not null filter (speed)
        player
    }))
}
