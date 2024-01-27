import { RaidHubRoute } from "../RaidHubRoute"
import {
    ClearsLeaderboardsForRaid,
    IndividualBoard,
    IndividualBoardNames
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
import { z, zISODateString, zPositiveInt } from "../schema/zod"
import { prisma } from "../services/prisma"
import { groupBy } from "../util/helpers"
import { ok } from "../util/response"

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

export const manifestRoute = new RaidHubRoute({
    method: "get",
    middlewares: [cacheControl(60)],
    handler: async () =>
        ok({
            raids,
            difficulties,
            hashes: AllRaidHashes,
            listed: [...ListedRaids],
            sunset: [...SunsetRaids],
            contest: [...ContestRaids],
            master: [...MasterRaids],
            prestige: [...PrestigeRaids],
            reprisedChallengePairings: ReprisedRaidDifficultyPairings.map(([raid, difficulty]) => ({
                raid,
                difficulty
            })),
            leaderboards: {
                worldFirst: await listLeaderboards(),
                individual: Object.fromEntries(
                    Object.entries(ClearsLeaderboardsForRaid).map(([raid, boards]) => [
                        raid,
                        Object.entries(boards)
                            .filter(([_, v]) => v)
                            .map(([k, _]) => ({
                                name: IndividualBoardNames[k as IndividualBoard],
                                category: k
                            }))
                    ])
                )
            }
        }),
    response: {
        success: z
            .object({
                raids: z.record(z.string()),
                difficulties: z.record(z.string()),
                hashes: z.record(
                    z.object({
                        raid: zPositiveInt(),
                        difficulty: zPositiveInt()
                    })
                ),
                listed: z.array(zPositiveInt()),
                sunset: z.array(zPositiveInt()),
                contest: z.array(zPositiveInt()),
                master: z.array(zPositiveInt()),
                prestige: z.array(zPositiveInt()),
                reprisedChallengePairings: z.array(
                    z.object({
                        raid: z.number(),
                        difficulty: z.number()
                    })
                ),
                leaderboards: z.object({
                    worldFirst: z.record(
                        z.array(
                            z.object({
                                id: z.string(),
                                type: z.string(),
                                date: zISODateString()
                            })
                        )
                    ),
                    individual: z.record(
                        z.array(
                            z.object({
                                name: z.string(),
                                category: z.string()
                            })
                        )
                    )
                })
            })
            .strict()
    }
})

async function listLeaderboards() {
    const boards = await prisma.activityLeaderboard.findMany({})
    const formattedBoards = boards.map(board => ({ ...board, type: board.type.toLowerCase() }))

    return groupBy<(typeof formattedBoards)[number], "raidId", ListedRaid>(
        formattedBoards,
        "raidId",
        {
            remove: true
        }
    )
}
