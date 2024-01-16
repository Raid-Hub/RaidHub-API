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
import { groupBy } from "../util/helpers"
import { cacheControl } from "../middlewares/cache-control"
import { RaidHubRoute, ok } from "../RaidHubRoute"
import { prisma } from "../prisma"
import { z } from "zod"

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
            listed: ListedRaids,
            sunset: SunsetRaids,
            contest: ContestRaids,
            master: MasterRaids,
            prestige: PrestigeRaids,
            reprisedChallengePairings: ReprisedRaidDifficultyPairings.map(([raid, difficulty]) => ({
                raid,
                difficulty
            })),
            leaderboards: await listLeaderboards()
        }),
    response: {
        success: z
            .object({
                raids: z.record(z.string()),
                difficulties: z.record(z.string()),
                hashes: z.record(
                    z.object({
                        raid: z.number(),
                        difficulty: z.number()
                    })
                ),
                listed: z.array(z.number()).readonly(),
                sunset: z.array(z.number()).readonly(),
                contest: z.array(z.number()).readonly(),
                master: z.array(z.number()).readonly(),
                prestige: z.array(z.number()).readonly(),
                reprisedChallengePairings: z.array(
                    z.object({
                        raid: z.number(),
                        difficulty: z.number()
                    })
                ),
                leaderboards: z.record(
                    z.array(
                        z.object({
                            id: z.string(),
                            type: z.string(),
                            date: z.date()
                        })
                    )
                )
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
