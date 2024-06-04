import { z } from "zod"
import { registry } from ".."

export type InstanceMetadata = z.infer<typeof zInstanceMetadata>
export const zInstanceMetadata = registry.register(
    "InstanceMetadata",
    z.object({
        activityName: z.string(),
        versionName: z.string(),
        isRaid: z.boolean()
    })
)
