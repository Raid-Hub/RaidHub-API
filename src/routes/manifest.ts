import { RaidHubRoute } from "../RaidHubRoute"
import {
    GlobalBoard,
    GlobalBoardNames,
    GlobalBoards,
    IndividualBoard,
    IndividualBoardNames,
    IndividualClearsBoards,
    IndividualClearsLeaderboardsForRaid,
    IndividualPantheonBoards,
    UrlPathsToPantheonVersion,
    UrlPathsToRaid,
    WorldFirstBoards,
    WorldFirstBoardsMap
} from "../data/leaderboards"
import {
    Activity,
    ContestRaids,
    ListedRaid,
    ListedRaids,
    MasterRaids,
    PantheonModes,
    PrestigeRaids,
    ReprisedRaidDifficultyPairings,
    SunsetRaids
} from "../data/raids"
import { cacheControl } from "../middlewares/cache-control"
import { registry, zActivityEnum, zRaidEnum, zVersionEnum } from "../schema/common"
import { z, zISODateString, zNumberEnum } from "../schema/zod"
import { prisma } from "../services/prisma"
import { groupBy } from "../util/helpers"
import { ok } from "../util/response"
import { zPantheonPath, zRaidPath } from "./leaderboard/_schema"

// todo: add to DB
const checkpoints: Record<ListedRaid, string> = {
    [Activity.LEVIATHAN]: "Calus",
    [Activity.EATER_OF_WORLDS]: "Argos",
    [Activity.SPIRE_OF_STARS]: "Val Ca'uor",
    [Activity.LAST_WISH]: "Queenswalk",
    [Activity.SCOURGE_OF_THE_PAST]: "Insurrection Prime",
    [Activity.CROWN_OF_SORROW]: "Gahlran",
    [Activity.GARDEN_OF_SALVATION]: "Sanctified Mind",
    [Activity.DEEP_STONE_CRYPT]: "Taniks",
    [Activity.VAULT_OF_GLASS]: "Atheon",
    [Activity.VOW_OF_THE_DISCIPLE]: "Rhulk",
    [Activity.KINGS_FALL]: "Oryx",
    [Activity.ROOT_OF_NIGHTMARES]: "Nezarec",
    [Activity.CROTAS_END]: "Crota"
}

const zPantheonEnum = registry.register("PantheonEnum", zNumberEnum(PantheonModes))
const zSunsetRaidEnum = registry.register("SunsetRaidEnum", zNumberEnum(SunsetRaids))
const zMasterRaidEnum = registry.register("MasterRaidEnum", zNumberEnum(MasterRaids))
const zPrestigeRaidEnum = registry.register("PrestigeRaidEnum", zNumberEnum(PrestigeRaids))
const zContestRaidEnum = registry.register("ContestRaidEnum", zNumberEnum(ContestRaids))

export const manifestRoute = new RaidHubRoute({
    method: "get",
    middlewares: [cacheControl(60)],
    handler: async () => {
        const [worldFirstLeaderboards, activities, versions, hashes, pantheon] = await Promise.all([
            listWFLeaderboards(),
            prisma.activityDefinition.findMany({
                select: {
                    id: true,
                    name: true
                }
            }),
            prisma.versionDefinition.findMany({
                select: {
                    id: true,
                    name: true
                }
            }),
            prisma.activityHash.findMany({
                select: {
                    hash: true,
                    versionId: true,
                    activityId: true
                }
            }),
            prisma.activityHash.findMany({
                select: {
                    versionDefinition: true
                },
                where: {
                    activityId: Activity.THE_PANTHEON
                }
            })
        ])
        return ok({
            activityStrings: Object.fromEntries(activities.map(a => [a.id, a.name])),
            versionStrings: Object.fromEntries(versions.map(a => [a.id, a.name])),
            hashes: Object.fromEntries(
                hashes.map(h => [h.hash, { activityId: h.activityId, versionId: h.versionId }])
            ),
            pantheonId: Activity.THE_PANTHEON,
            pantheonModes: [...PantheonModes],
            listed: [...ListedRaids],
            sunset: [...SunsetRaids],
            contest: [...ContestRaids],
            master: [...MasterRaids],
            prestige: [...PrestigeRaids],
            reprisedChallengePairings: ReprisedRaidDifficultyPairings.map(
                ([raid, version, triumphName]) => ({
                    raid,
                    version,
                    triumphName
                })
            ),
            raidUrlPaths: Object.fromEntries(
                Object.entries(UrlPathsToRaid).map(([k, v]) => [
                    v,
                    k as keyof typeof UrlPathsToRaid
                ])
            ),
            pantheonUrlPaths: Object.fromEntries(
                Object.entries(UrlPathsToPantheonVersion).map(([k, v]) => [
                    v,
                    k as keyof typeof UrlPathsToPantheonVersion
                ])
            ),
            leaderboards: {
                worldFirst: worldFirstLeaderboards,
                global: Object.entries(GlobalBoardNames).map(
                    ([category, { displayName, format }]) => ({
                        category: category as GlobalBoard,
                        displayName,
                        format
                    })
                ),
                individual: {
                    clears: Object.fromEntries(
                        Object.entries(IndividualClearsLeaderboardsForRaid).map(
                            ([raid, boards]) => [
                                raid,
                                Object.entries(boards)
                                    .filter(([_, v]) => v)
                                    .map(([k, _]) => ({
                                        displayName: IndividualBoardNames[k as IndividualBoard],
                                        category: k as Exclude<IndividualBoard, "sherpas">
                                    }))
                            ]
                        )
                    )
                },
                pantheon: {
                    individual: [
                        {
                            displayName: "Total Clears",
                            category: "total" as const
                        },
                        {
                            displayName: "Sherpas",
                            category: "sherpas" as const
                        },
                        {
                            displayName: "Trios",
                            category: "trios" as const
                        },
                        {
                            displayName: "Duos",
                            category: "duos" as const
                        }
                    ],
                    first: pantheon.map(p => ({
                        displayName: p.versionDefinition.name,
                        path: Object.entries(UrlPathsToPantheonVersion).find(
                            ([, v]) => v == p.versionDefinition.id
                        )![0],
                        versionId: p.versionDefinition.id
                    })),
                    speedrun: pantheon.map(p => ({
                        displayName: p.versionDefinition.name,
                        path: Object.entries(UrlPathsToPantheonVersion).find(
                            ([, v]) => v == p.versionDefinition.id
                        )![0],
                        versionId: p.versionDefinition.id
                    }))
                }
            },
            checkpointNames: checkpoints
        })
    },
    response: {
        success: {
            statusCode: 200,
            schema: z
                .object({
                    hashes: z.record(
                        z.object({
                            activityId: zActivityEnum,
                            versionId: zVersionEnum
                        })
                    ),
                    listed: z.array(zRaidEnum),
                    pantheonId: zActivityEnum,
                    pantheonModes: z.array(zPantheonEnum),
                    sunset: z.array(zSunsetRaidEnum),
                    contest: z.array(zContestRaidEnum),
                    master: z.array(zMasterRaidEnum),
                    prestige: z.array(zPrestigeRaidEnum),
                    reprisedChallengePairings: z.array(
                        z.object({
                            raid: zRaidEnum,
                            version: zVersionEnum,
                            triumphName: z.string()
                        })
                    ),
                    leaderboards: z.object({
                        global: z.array(
                            z.object({
                                category: z.enum(GlobalBoards),
                                displayName: z.string(),
                                format: z.enum(["number", "time"])
                            })
                        ),
                        worldFirst: z.record(
                            z.array(
                                z.object({
                                    id: z.string(),
                                    displayName: z.string(),
                                    category: z.enum(WorldFirstBoards),
                                    date: zISODateString()
                                })
                            )
                        ),
                        individual: z.object({
                            clears: z.record(
                                z.array(
                                    z.object({
                                        displayName: z.string(),
                                        category: z.enum(IndividualClearsBoards)
                                    })
                                )
                            )
                        }),
                        pantheon: z.object({
                            individual: z.array(
                                z.object({
                                    displayName: z.string(),
                                    category: z.enum(IndividualPantheonBoards)
                                })
                            ),
                            first: z.array(
                                z.object({
                                    versionId: zPantheonEnum,
                                    path: z.string(),
                                    displayName: z.string()
                                })
                            ),
                            speedrun: z.array(
                                z.object({
                                    versionId: zPantheonEnum,
                                    path: z.string(),
                                    displayName: z.string()
                                })
                            )
                        })
                    }),
                    raidUrlPaths: z.record(zRaidPath),
                    pantheonUrlPaths: z.record(zPantheonPath),
                    activityStrings: z.record(z.string()),
                    versionStrings: z.record(z.string()),
                    checkpointNames: z.record(z.string())
                })
                .strict()
        }
    }
})

async function listWFLeaderboards() {
    const boards = await prisma.activityLeaderboard.findMany({})
    const formatted = boards.map(b => ({
        raidId: b.raidId,
        id: b.id,
        date: b.date,
        category: WorldFirstBoardsMap.find(([, type]) => type === b.type)![0],
        displayName:
            b.type === "Challenge"
                ? ReprisedRaidDifficultyPairings.find(([raid]) => raid === b.raidId)![2]
                : b.type
    }))

    return groupBy<(typeof formatted)[number], "raidId", ListedRaid>(formatted, "raidId", {
        remove: true
    })
}
