import { z } from "zod"
import { registry } from ".."
import { zBigIntString, zNaturalNumber } from "../util"
import { zPlayerInfo } from "./PlayerInfo"

export type TeamLeaderboardEntry = z.infer<typeof zTeamLeaderboardEntry>
export const zTeamLeaderboardEntry = registry.register(
    "TeamLeaderboardEntry",
    z.object({
        position: zNaturalNumber(),
        rank: zNaturalNumber(),
        value: z.number(),
        instanceId: zBigIntString(),
        players: z.array(zPlayerInfo)
    })
)

export type IndividualLeaderboardEntry = z.infer<typeof zIndividualLeaderboardEntry>
export const zIndividualLeaderboardEntry = registry.register(
    "IndividualLeaderboardEntry",
    z.object({
        position: zNaturalNumber(),
        rank: zNaturalNumber(),
        value: z.number(),
        playerInfo: zPlayerInfo
    })
)

export type LeaderboardData<T extends "team" | "individual"> = z.infer<typeof zLeaderboardData> & {
    type: T
}
export const zLeaderboardData = registry.register(
    "LeaderboardData",
    z.discriminatedUnion("type", [
        z.object({
            type: z.literal("team"),
            format: z.enum(["duration", "numerical"]),
            page: zNaturalNumber(),
            count: zNaturalNumber(),
            entries: z.array(zTeamLeaderboardEntry)
        }),
        z.object({
            type: z.literal("individual"),
            format: z.enum(["duration", "numerical"]),
            page: zNaturalNumber(),
            count: zNaturalNumber(),
            entries: z.array(zIndividualLeaderboardEntry)
        })
    ])
)
