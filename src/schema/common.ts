import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi"
import { BungieMembershipType } from "bungie-net-core/enums"
import { ZodNativeEnumDef, ZodType } from "zod"
import { ListedRaids, RaidVersions } from "../data/raids"
import { z, zBigIntString, zISODateString, zNumberEnum, zPositiveInt } from "./zod"

export const registry = new OpenAPIRegistry()

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

export const zRaidEnum = registry.register("RaidEnum", zNumberEnum(ListedRaids))
export const zRaidVersionEnum = registry.register("RaidVersionEnum", zNumberEnum(RaidVersions))

export const zPlayerInfo = registry.register(
    "PlayerInfo",
    z
        .object({
            membershipId: zBigIntString(),
            membershipType: zBungieMembershipType.nullable(),
            iconPath: z
                .string()
                .regex(/\/common\/destiny2_content\/icons\/\w+\.(jpg|gif)/)
                .nullable()
                .openapi({
                    example: "/common/destiny2_content/icons/93844c8b76ea80683a880479e3506980.jpg"
                }),
            displayName: z.string().nullable(),
            bungieGlobalDisplayName: z.string().nullable(),
            bungieGlobalDisplayNameCode: z.string().nullable()
        })
        .openapi({
            example: {
                bungieGlobalDisplayName: "Newo",
                bungieGlobalDisplayNameCode: "9010",
                membershipId: "4611686018488107374" as unknown as bigint,
                displayName: "xx_newo_xx",
                iconPath: "/common/destiny2_content/icons/93844c8b76ea80683a880479e3506980.jpg",
                membershipType: 3
            }
        })
        .strict()
)

export const zActivity = registry.register(
    "Activity",
    z
        .object({
            instanceId: zBigIntString(),
            raidHash: zBigIntString(),
            completed: z.boolean(),
            flawless: z.boolean().nullable(),
            fresh: z.boolean().nullable(),
            playerCount: zPositiveInt(),
            dateStarted: zISODateString(),
            dateCompleted: zISODateString(),
            duration: zPositiveInt(),
            platformType: zBungieMembershipType.default(0)
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
            finishedRaid: z.boolean(),
            kills: z.number().int().nonnegative(),
            assists: z.number().int().nonnegative(),
            deaths: z.number().int().nonnegative(),
            timePlayedSeconds: z.number().int().nonnegative(),
            classHash: zBigIntString().nullable(),
            sherpas: z.number().int(),
            isFirstClear: z.boolean()
        })
        .strict()
)

export const zPlayerWithActivityData = registry.register(
    "PlayerWithActivityData",
    zPlayerInfo
        .extend({
            player: zActivityPlayerData
        })
        .strict()
)

export const zActivityWithPlayerData = registry.register(
    "ActivityWithPlayerData",
    zActivityExtended
        .extend({
            player: zActivityPlayerData
        })
        .strict()
)
