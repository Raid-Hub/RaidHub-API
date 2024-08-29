import { z } from "zod"
import { registry } from ".."
import { zNaturalNumber, zWholeNumber } from "../util"
import { zPlayerInfo } from "./PlayerInfo"

export type Teammate = z.input<typeof zTeammate>
export const zTeammate = registry.register(
    "Teammate",
    z
        .object({
            estimatedTimePlayedSeconds: zNaturalNumber(),
            clears: zWholeNumber(),
            instanceCount: zNaturalNumber(),
            playerInfo: zPlayerInfo
        })
        .strict()
)
