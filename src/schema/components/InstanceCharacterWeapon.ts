import { z } from "zod"
import { registry } from ".."
import { zBigIntString, zWholeNumber } from "../util"

export const zInstanceCharacterWeapon = registry.register(
    "InstanceCharacterWeapon",
    z
        .object({
            weaponHash: zBigIntString(),
            kills: zWholeNumber(),
            precisionKills: zWholeNumber()
        })
        .strict()
)
