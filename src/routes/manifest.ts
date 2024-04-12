import { RaidHubRoute } from "../RaidHubRoute"
import {
    GlobalBoard,
    GlobalBoardNames,
    GlobalBoards,
    IndividualBoard,
    IndividualBoardNames,
    IndividualClearsBoards,
    IndividualClearsLeaderboardsForRaid,
    UrlPathsToRaid,
    WorldFirstBoards,
    WorldFirstBoardsMap
} from "../data/leaderboards"
import {
    ContestRaids,
    ListedRaid,
    ListedRaids,
    MasterRaids,
    PantheonModes,
    PrestigeRaids,
    Raid,
    ReprisedRaidDifficultyPairings,
    SunsetRaids
} from "../data/raids"
import { cacheControl } from "../middlewares/cache-control"
import { registry, zActivityEnum, zRaidEnum, zVersionEnum } from "../schema/common"
import { z, zISODateString, zNumberEnum } from "../schema/zod"
import { prisma } from "../services/prisma"
import { groupBy } from "../util/helpers"
import { ok } from "../util/response"
import { zRaidPath } from "./leaderboard/_schema"

// todo: add to DB
const checkpoints: Record<ListedRaid, string> = {
    [Raid.LEVIATHAN]: "Calus",
    [Raid.EATER_OF_WORLDS]: "Argos",
    [Raid.SPIRE_OF_STARS]: "Val Ca'uor",
    [Raid.LAST_WISH]: "Queenswalk",
    [Raid.SCOURGE_OF_THE_PAST]: "Insurrection Prime",
    [Raid.CROWN_OF_SORROW]: "Gahlran",
    [Raid.GARDEN_OF_SALVATION]: "Sanctified Mind",
    [Raid.DEEP_STONE_CRYPT]: "Taniks",
    [Raid.VAULT_OF_GLASS]: "Atheon",
    [Raid.VOW_OF_THE_DISCIPLE]: "Rhulk",
    [Raid.KINGS_FALL]: "Oryx",
    [Raid.ROOT_OF_NIGHTMARES]: "Nezarec",
    [Raid.CROTAS_END]: "Crota"
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
        const [worldFirstLeaderboards, activities, versions, hashes] = await Promise.all([
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
            })
        ])
        return ok({
            activityStrings: Object.fromEntries(activities.map(a => [a.id, a.name])),
            versionStrings: Object.fromEntries(versions.map(a => [a.id, a.name])),
            hashes: Object.fromEntries(
                hashes.map(h => [h.hash, { activityId: h.activityId, versionId: h.versionId }])
            ),
            pantheon: [...PantheonModes],
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
                    pantheon: z.array(zPantheonEnum),
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
                        })
                    }),
                    raidUrlPaths: z.record(zRaidPath),
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
