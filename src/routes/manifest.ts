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
} from "~/data/raids"
import { groupBy, success } from "util/helpers"
import { cacheControl } from "~/middlewares/cache-control"
import { RaidHubRoute } from "route"
import { prisma } from "~/prisma"
import { ActivityLeaderboard, WorldFirstLeaderboardType } from "@prisma/client"
import { MasterReleases, PrestigeReleases, ReleaseDate } from "~/data/raceDates"

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
    async handler(req, res, next) {
        try {
            res.status(200).json(
                success({
                    raids,
                    difficulties,
                    hashes: AllRaidHashes,
                    listed: ListedRaids,
                    sunset: SunsetRaids,
                    contest: ContestRaids,
                    master: MasterRaids,
                    prestige: PrestigeRaids,
                    reprisedChallengePairings: ReprisedRaidDifficultyPairings.map(
                        ([raid, difficulty]) => ({
                            raid,
                            difficulty
                        })
                    ),
                    leaderboards: await listLeaderboards()
                })
            )
        } catch (e) {
            next(e)
        }
    }
})

async function listLeaderboards() {
    const boards = await prisma.activityLeaderboard.findMany({})
    const formattedBoards = boards.map(board => ({ ...board, type: board.type.toLowerCase() }))

    return groupBy<(typeof formattedBoards)[number], "raidId", ListedRaid>(
        formattedBoards,
        "raidId",
        true
    )
}
