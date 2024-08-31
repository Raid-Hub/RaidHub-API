import { z } from "zod"
import { registry } from ".."
import { zNaturalNumber } from "../util"
import { zInstance } from "./Instance"
import { zInstanceMetadata } from "./InstanceMetadata"
import { zInstancePlayerExtended } from "./InstancePlayerExtended"

export type InstanceExtended = z.input<typeof zInstanceExtended>
export const zInstanceExtended = registry.register(
    "InstanceExtended",
    zInstance
        .extend({
            leaderboardRank: zNaturalNumber().nullable(),
            metadata: zInstanceMetadata,
            players: z.array(zInstancePlayerExtended)
        })
        .openapi({
            example: undefined
        })
)
