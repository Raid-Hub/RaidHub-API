import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi"
import { BungieMembershipType } from "bungie-net-core/enums"
import { ZodNativeEnumDef, ZodType } from "zod"
import { Activity, ListedRaids, PantheonModes, RaidVersions } from "../data/raids"
import { z, zBigIntString, zISODateString, zNumberEnum, zPositiveInt } from "./zod"

export const registry = new OpenAPIRegistry()

export enum ErrorCode {
    Unknown = "Unknown",
    PlayerNotFoundError = "PlayerNotFoundError",
    ActivityNotFoundError = "ActivityNotFoundError",
    PGCRNotFoundError = "PGCRNotFoundError",
    LeaderboardNotFoundError = "LeaderboardNotFoundError",
    InvalidClientSecretError = "InvalidClientSecretError",
    InsufficientPermissionsError = "InsufficientPermissionsError",
    PathValidationError = "PathValidationError",
    QueryValidationError = "QueryValidationError",
    BodyValidationError = "BodyValidationError",
    InternalServerError = "InternalServerError",
    ApiKeyError = "ApiKeyError",
    AdminQuerySyntaxError = "AdminQuerySyntaxError"
}

export const zBungieMembershipType = registry.register(
    "BungieMembershipType",
    (
        z.nativeEnum(BungieMembershipType) as ZodType<
            (typeof BungieMembershipType)[keyof typeof BungieMembershipType],
            ZodNativeEnumDef<typeof BungieMembershipType>,
            number
        >
    ).openapi({
        externalDocs: {
            url: "https://bungie-net.github.io/#/components/schemas/BungieMembershipType"
        }
    })
)

export const zActivityEnum = registry.register(
    "ActivityEnum",
    zNumberEnum([...ListedRaids, Activity.THE_PANTHEON])
)
export const zRaidEnum = registry.register("RaidEnum", zNumberEnum(ListedRaids))
export const zVersionEnum = registry.register(
    "ActivityVersionEnum",
    zNumberEnum([...RaidVersions, ...PantheonModes])
)

export const zPlayerInfo = registry.register(
    "PlayerInfo",
    z
        .object({
            membershipId: zBigIntString(),
            membershipType: zBungieMembershipType.nullable().openapi({
                param: {
                    schema: {
                        nullable: true
                    }
                },
                description: "The platform on which the player created their account."
            }),
            iconPath: z.string().nullable(),
            displayName: z.string().nullable().openapi({
                description:
                    "The platform-specific display name of the player. No longer shown in-game."
            }),
            bungieGlobalDisplayName: z.string().nullable(),
            bungieGlobalDisplayNameCode: z.string().nullable(),
            lastSeen: zISODateString()
        })
        .openapi({
            example: {
                bungieGlobalDisplayName: "Newo",
                bungieGlobalDisplayNameCode: "9010",
                membershipId: "4611686018488107374" as unknown as bigint,
                displayName: "xx_newo_xx",
                iconPath: "/common/destiny2_content/icons/93844c8b76ea80683a880479e3506980.jpg",
                membershipType: 3,
                lastSeen: new Date("2021-05-01T00:00:00.000Z")
            }
        })
        .strict()
)

export const zActivity = registry.register(
    "Activity",
    z
        .object({
            instanceId: zBigIntString(),
            hash: zBigIntString(),
            completed: z.boolean(),
            flawless: z.boolean().nullable(),
            fresh: z.boolean().nullable(),
            playerCount: zPositiveInt(),
            dateStarted: zISODateString(),
            dateCompleted: zISODateString(),
            duration: zPositiveInt(),
            platformType: zBungieMembershipType.default(0),
            score: z.number().int().nonnegative()
        })
        .strict()
)

export const zActivityExtended = registry.register(
    "ActivityExtended",
    zActivity
        .extend({
            dayOne: z.boolean(),
            contest: z.boolean(),
            weekOne: z.boolean()
        })
        .strict()
)

export const zActivityPlayerData = registry.register(
    "ActivityPlayerData",
    z
        .object({
            completed: z.boolean(),
            sherpas: z.number().int().nonnegative(),
            isFirstClear: z.boolean(),
            timePlayedSeconds: z.number().int().nonnegative()
        })
        .strict()
)

export const zActivityCharacterWeapon = registry.register(
    "ActivityCharacterWeapon",
    z.object({
        weaponHash: zBigIntString(),
        kills: z.number().int().nonnegative(),
        precisionKills: z.number().int().nonnegative()
    })
)

export const zActivityCharacter = registry.register(
    "ActivityCharacter",
    z.object({
        characterId: zBigIntString(),
        classHash: zBigIntString().nullable(),
        emblemHash: zBigIntString().nullable(),
        completed: z.boolean(),
        timePlayedSeconds: z.number().int().nonnegative(),
        startSeconds: z.number().int().nonnegative(),
        score: z.number().int().nonnegative(),
        kills: z.number().int().nonnegative(),
        deaths: z.number().int().nonnegative(),
        assists: z.number().int().nonnegative(),
        precisionKills: z.number().int().nonnegative(),
        superKills: z.number().int().nonnegative(),
        grenadeKills: z.number().int().nonnegative(),
        meleeKills: z.number().int().nonnegative(),
        weapons: z.array(zActivityCharacterWeapon)
    })
)

export const zPlayerWithExtendedActivityData = registry.register(
    "PlayerWithExtendedActivityData",
    z.object({
        player: zPlayerInfo,
        data: z.object({
            completed: z.boolean(),
            sherpas: z.number().int().nonnegative(),
            isFirstClear: z.boolean(),
            timePlayedSeconds: z.number().int().nonnegative(),
            characters: z.array(zActivityCharacter)
        })
    })
)

export const zActivityWithPlayerData = registry.register(
    "ActivityWithPlayerData",
    zActivityExtended
        .extend({
            player: zActivityPlayerData
        })
        .strict()
)
