import { z } from "zod"
import { registry } from ".."
import { zUInt32 } from "../util"

export type WeaponElement = z.input<typeof zWeaponElement>
export const zWeaponElement = registry.register(
    "WeaponElement",
    z.enum(["Kinetic", "Solar", "Arc", "Void", "Stasis", "Strand"])
)

export type WeaponSlot = z.input<typeof zWeaponSlot>
export const zWeaponSlot = registry.register("WeaponSlot", z.enum(["Kinetic", "Energy", "Power"]))

export type WeaponAmmoType = z.input<typeof zWeaponAmmoType>
export const zWeaponAmmoType = registry.register(
    "WeaponAmmoType",
    z.enum(["Primary", "Special", "Heavy"])
)

export type WeaponRarity = z.input<typeof zWeaponRarity>
export const zWeaponRarity = registry.register(
    "WeaponRarity",
    z.enum(["Common", "Uncommon", "Rare", "Legendary", "Exotic"])
)

export type Weapon = z.input<typeof zWeapon>
export const zWeapon = registry.register(
    "Weapon",
    z.object({
        hash: zUInt32(),
        name: z.string(),
        iconPath: z.string(),
        element: zWeaponElement,
        slot: zWeaponSlot,
        ammoType: zWeaponAmmoType,
        rarity: zWeaponRarity
    })
)
