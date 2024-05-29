import { z } from "zod"
import { registry } from ".."
import { zInstance } from "./Instance"
import { zInstanceMetadata } from "./InstanceMetadata"
import { zInstancePlayerExtended } from "./InstancePlayerExtended"

export type InstanceExtended = z.infer<typeof zInstanceExtended>
export const zInstanceExtended = registry.register(
    "InstanceExtended",
    zInstance
        .extend({
            metadata: zInstanceMetadata,
            players: z.array(zInstancePlayerExtended)
        })
        .openapi({
            example: undefined
        })
)
