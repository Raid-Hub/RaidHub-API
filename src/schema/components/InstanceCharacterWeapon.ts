import { z } from "zod"
import { registry } from ".."
import { zUInt32, zWholeNumber } from "../util"

export type InstanceCharacterWeapon = z.input<typeof zInstanceCharacterWeapon>
export const zInstanceCharacterWeapon = registry.register(
    "InstanceCharacterWeapon",
    z
        .object({
            weaponHash: zUInt32(),
            kills: zWholeNumber(),
            precisionKills: zWholeNumber()
        })
        .strict()
)
