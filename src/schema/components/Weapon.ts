import { z } from "zod"
import { registry } from ".."
import { zBigIntString } from "../util"

export type WeaponElement = z.infer<typeof zWeaponElement>
export const zWeaponElement = registry.register(
    "WeaponElement",
    z.enum(["Kinetic", "Solar", "Arc", "Void", "Stasis", "Strand"])
)

export type WeaponSlot = z.infer<typeof zWeaponSlot>
export const zWeaponSlot = registry.register("WeaponSlot", z.enum(["Kinetic", "Energy", "Power"]))

export type WeaponAmmoType = z.infer<typeof zWeaponAmmoType>
export const zWeaponAmmoType = registry.register(
    "WeaponAmmoType",
    z.enum(["Primary", "Special", "Heavy"])
)

export type WeaponRarity = z.infer<typeof zWeaponRarity>
export const zWeaponRarity = registry.register(
    "WeaponRarity",
    z.enum(["Common", "Uncommon", "Rare", "Legendary", "Exotic"])
)

export type Weapon = z.infer<typeof zWeapon>
export const zWeapon = registry.register(
    "Weapon",
    z.object({
        hash: zBigIntString(),
        name: z.string(),
        iconPath: z.string(),
        element: zWeaponElement,
        slot: zWeaponSlot,
        ammoType: zWeaponAmmoType,
        rarity: zWeaponRarity
    })
)
