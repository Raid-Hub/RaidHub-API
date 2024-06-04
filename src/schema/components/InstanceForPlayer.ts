import { z } from "zod"
import { registry } from ".."
import { zInstance } from "./Instance"
import { zInstancePlayer } from "./InstancePlayer"

export type InstanceForPlayer = z.infer<typeof zInstanceForPlayer>
export const zInstanceForPlayer = registry.register(
    "InstanceForPlayer",
    zInstance
        .extend({
            player: zInstancePlayer
        })
        .openapi({
            example: undefined
        })
)
