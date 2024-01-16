import { z } from "zod"
import { BungieMembershipType, DestinyActivityModeType } from "bungie-net-core/enums"

const DestinyHistoricalStatsValuePairSchema = z
    .object({
        basic: z
            .object({
                value: z.number(),
                displayValue: z.string()
            })
            .strip()
    })
    .strip()

export const pgcrSchema = z
    .object({
        period: z.string(),
        startingPhaseIndex: z.number().optional(),
        activityWasStartedFromBeginning: z.boolean().optional(),
        activityDetails: z
            .object({
                directorActivityHash: z.number(),
                instanceId: z.string(),
                mode: z.nativeEnum(DestinyActivityModeType),
                modes: z.array(z.nativeEnum(DestinyActivityModeType)),
                membershipType: z.nativeEnum(BungieMembershipType)
            })
            .strip(),
        entries: z.array(
            z
                .object({
                    player: z
                        .object({
                            destinyUserInfo: z
                                .object({
                                    iconPath: z.string().nullable().optional(),
                                    crossSaveOverride: z.nativeEnum(BungieMembershipType),
                                    applicableMembershipTypes: z
                                        .array(z.nativeEnum(BungieMembershipType))
                                        .nullable()
                                        .optional(),
                                    membershipType: z
                                        .nativeEnum(BungieMembershipType)
                                        .nullable()
                                        .optional(),
                                    membershipId: z.string(),
                                    displayName: z.string().nullable().optional(),
                                    bungieGlobalDisplayName: z.string().nullable().optional(),
                                    bungieGlobalDisplayNameCode: z.number().nullable().optional()
                                })
                                .strip(),
                            characterClass: z.string().nullable().optional(),
                            classHash: z.number(),
                            raceHash: z.number(),
                            genderHash: z.number(),
                            characterLevel: z.number(),
                            lightLevel: z.number(),
                            emblemHash: z.number()
                        })
                        .strip(),
                    characterId: z.string(),
                    values: z.record(DestinyHistoricalStatsValuePairSchema),
                    extended: z
                        .object({
                            weapons: z
                                .array(
                                    z
                                        .object({
                                            referenceId: z.number(),
                                            values: z.record(DestinyHistoricalStatsValuePairSchema)
                                        })
                                        .strip()
                                )
                                .nullable()
                                .optional(),
                            values: z.record(DestinyHistoricalStatsValuePairSchema)
                        })
                        .strip()
                        .optional()
                })
                .strip()
        )
    })
    .strip()
