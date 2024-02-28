import { RaidHubRoute } from "../RaidHubRoute"
import {
    GlobalBoard,
    GlobalBoardNames,
    GlobalBoards,
    IndividualBoard,
    IndividualBoardNames,
    IndividualClearsLeaderboardsForRaid,
    UrlPathsToRaid,
    WorldFirstBoards,
    WorldFirstBoardsMap
} from "../data/leaderboards"
import {
    AllRaidHashes,
    ContestRaids,
    Difficulty,
    ListedRaid,
    ListedRaids,
    MasterRaids,
    PrestigeRaids,
    Raid,
    ReprisedRaidDifficultyPairings,
    SunsetRaids
} from "../data/raids"
import { cacheControl } from "../middlewares/cache-control"
import { registry, zRaidEnum, zRaidVersionEnum } from "../schema/common"
import { z, zISODateString, zNumberEnum } from "../schema/zod"
import { prisma } from "../services/prisma"
import { groupBy } from "../util/helpers"
import { ok } from "../util/response"
import { zRaidPath } from "./leaderboard/_schema"

const raids: Record<Raid, string> = {
    [Raid.NA]: "N/A",
    [Raid.LEVIATHAN]: "Leviathan",
    [Raid.EATER_OF_WORLDS]: "Eater of Worlds",
    [Raid.SPIRE_OF_STARS]: "Spire of Stars",
    [Raid.LAST_WISH]: "Last Wish",
    [Raid.SCOURGE_OF_THE_PAST]: "Scourge of the Past",
    [Raid.CROWN_OF_SORROW]: "Crown of Sorrow",
    [Raid.GARDEN_OF_SALVATION]: "Garden of Salvation",
    [Raid.DEEP_STONE_CRYPT]: "Deep Stone Crypt",
    [Raid.VAULT_OF_GLASS]: "Vault of Glass",
    [Raid.VOW_OF_THE_DISCIPLE]: "Vow of the Disciple",
    [Raid.KINGS_FALL]: "King's Fall",
    [Raid.ROOT_OF_NIGHTMARES]: "Root of Nightmares",
    [Raid.CROTAS_END]: "Crota's End"
}
const difficulties: Record<Difficulty, string> = {
    [Difficulty.NA]: "N/A",
    [Difficulty.NORMAL]: "Normal",
    [Difficulty.GUIDEDGAMES]: "Guided Games",
    [Difficulty.PRESTIGE]: "Prestige",
    [Difficulty.MASTER]: "Master",
    [Difficulty.CHALLENGE_VOG]: "Challenge VOG",
    [Difficulty.CHALLENGE_KF]: "Challenge KF",
    [Difficulty.CHALLENGE_CROTA]: "Challenge Crota",
    [Difficulty.CONTEST]: "Contest"
}

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

const zSunsetRaidEnum = registry.register("SunsetRaidEnum", zNumberEnum(SunsetRaids))
const zMasterRaidEnum = registry.register("MasterRaidEnum", zNumberEnum(MasterRaids))
const zPrestigeRaidEnum = registry.register("PrestigeRaidEnum", zNumberEnum(PrestigeRaids))
const zContestRaidEnum = registry.register("ContestRaidEnum", zNumberEnum(ContestRaids))

export const manifestRoute = new RaidHubRoute({
    method: "get",
    middlewares: [cacheControl(60)],
    handler: async () =>
        ok({
            raidStrings: raids,
            difficultyStrings: difficulties,
            hashes: AllRaidHashes,
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
                worldFirst: await listWFLeaderboards(),
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
                                        name:
                                            IndividualBoardNames[k as IndividualBoard] + " Clears",
                                        category: k
                                    }))
                            ]
                        )
                    )
                }
            },
            checkpointNames: checkpoints
        }),
    response: {
        success: {
            statusCode: 200,
            schema: z
                .object({
                    hashes: z.record(
                        z.object({
                            raid: zRaidEnum,
                            version: zRaidVersionEnum
                        })
                    ),
                    listed: z.array(zRaidEnum),
                    sunset: z.array(zSunsetRaidEnum),
                    contest: z.array(zContestRaidEnum),
                    master: z.array(zMasterRaidEnum),
                    prestige: z.array(zPrestigeRaidEnum),
                    reprisedChallengePairings: z.array(
                        z.object({
                            raid: zRaidEnum,
                            version: zRaidVersionEnum,
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
                                        name: z.string(),
                                        category: z.string()
                                    })
                                )
                            )
                        })
                    }),
                    raidUrlPaths: z.record(zRaidPath),
                    raidStrings: z.record(z.string()),
                    difficultyStrings: z.record(z.string()),
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
        displayName: b.type
    }))

    return groupBy<(typeof formatted)[number], "raidId", ListedRaid>(formatted, "raidId", {
        remove: true
    })
}
