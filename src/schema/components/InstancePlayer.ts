import { z } from "zod"
import { registry } from ".."
import { zWholeNumber } from "../util"

export const zInstancePlayer = registry.register(
    "InstancePlayer",
    z
        .object({
            completed: z.boolean(),
            isFirstClear: z.boolean(),
            sherpas: zWholeNumber(),
            timePlayedSeconds: zWholeNumber()
        })
        .strict()
)
