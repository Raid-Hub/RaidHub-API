import { z } from "zod"
import { registry } from ".."
import { zInstanceCharacter } from "./InstanceCharacter"
import { zInstancePlayer } from "./InstancePlayer"
import { zPlayerInfo } from "./PlayerInfo"

export type InstancePlayerExtended = z.infer<typeof zInstancePlayerExtended>
export const zInstancePlayerExtended = registry.register(
    "InstancePlayerExtended",
    zInstancePlayer
        .extend({
            playerInfo: zPlayerInfo,
            characters: z.array(zInstanceCharacter)
        })
        .openapi({
            example: undefined
        })
)
