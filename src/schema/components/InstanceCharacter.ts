import { z } from "zod"
import { registry } from ".."
import { zBigIntString, zWholeNumber } from "../util"
import { zInstanceCharacterWeapon } from "./InstanceCharacterWeapon"

export const zInstanceCharacter = registry.register(
    "InstanceCharacter",
    z
        .object({
            characterId: zBigIntString(),
            classHash: zBigIntString().nullable(),
            emblemHash: zBigIntString().nullable(),
            completed: z.boolean(),
            timePlayedSeconds: zWholeNumber(),
            startSeconds: zWholeNumber(),
            score: zWholeNumber(),
            kills: zWholeNumber(),
            deaths: zWholeNumber(),
            assists: zWholeNumber(),
            precisionKills: zWholeNumber(),
            superKills: zWholeNumber(),
            grenadeKills: zWholeNumber(),
            meleeKills: zWholeNumber(),
            weapons: z.array(zInstanceCharacterWeapon)
        })
        .strict()
)
