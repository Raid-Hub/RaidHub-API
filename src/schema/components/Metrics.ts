import { z } from "zod"
import { registry } from ".."
import { zWholeNumber } from "../util"
import { zWeapon } from "./Weapon"

export type WeaponMetric = z.infer<typeof zWeaponMetric>
export const zWeaponMetric = registry.register(
    "WeaponMetric",
    z.object({
        weapon: zWeapon,
        usageCount: zWholeNumber(),
        killCount: zWholeNumber()
    })
)
