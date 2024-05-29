import { z } from "zod"
import { RaidHubRoute } from "../RaidHubRoute"
import {
    listActivityDefinitions,
    listHashes,
    listVersionDefinitions
} from "../data-access-layer/definitions"
import { cacheControl } from "../middlewares/cache-control"
import { zISODateString, zNaturalNumber } from "../schema/util"

export const manifestRoute = new RaidHubRoute({
    method: "get",
    description: `The RaidHub manifest provides definitions for all activities and versions in the RaidHub database.`,
    middleware: [cacheControl(30)],
    response: {
        success: {
            statusCode: 200,
            schema: z
                .object({
                    hashes: z
                        .record(
                            z.object({
                                activityId: zNaturalNumber(),
                                versionId: zNaturalNumber()
                            })
                        )
                        .openapi({
                            description:
                                "The mapping of each Bungie.net hash to a RaidHub activityId and versionId"
                        }),
                    activityDefinitions: z
                        .record(
                            z.object({
                                name: z.string(),
                                path: z.string(),
                                isSunset: z.boolean(),
                                isRaid: z.boolean(),
                                releaseDate: zISODateString().nullable(),
                                dayOneEnd: zISODateString().nullable(),
                                contestEnd: zISODateString().nullable(),
                                weekOneEnd: zISODateString().nullable()
                            })
                        )
                        .openapi({
                            description:
                                "The mapping of each RaidHub activityId to its English name"
                        }),
                    versionDefinitions: z
                        .record(
                            z.object({
                                name: z.string(),
                                path: z.string(),
                                associatedActivityId: zNaturalNumber().nullable()
                            })
                        )
                        .openapi({
                            description: "The mapping of each RaidHub versionId to its English name"
                        }),
                    raidIds: z.array(zNaturalNumber()).openapi({
                        description: "The list of activityId which are Raids"
                    }),
                    listedRaidIds: z.array(zNaturalNumber()).openapi({
                        description:
                            "The list of active raid activityId in order of newest to oldest"
                    }),
                    sunsetRaidIds: z.array(zNaturalNumber()).openapi({
                        description: "The list of inactive raid activityId"
                    }),
                    prestigeRaidIds: z.array(zNaturalNumber()).openapi({
                        description: "The list of raid activityId which had a prestige mode"
                    }),
                    masterRaidIds: z.array(zNaturalNumber()).openapi({
                        description: "The list of raid activityId which have a master mode"
                    }),
                    contestRaidIds: z.array(zNaturalNumber()).openapi({
                        description: "The list of raid activityId which had a contest mode"
                    }),
                    pantheonIds: z.array(zNaturalNumber()).openapi({
                        description: "The list of activityId for Pantheon"
                    }),
                    pantheonVersionIds: z.array(zNaturalNumber()).openapi({
                        description: "The set of versionId for Pantheon"
                    })
                })
                .strict()
        }
    },
    handler: async () => {
        const [activities, versions, hashes] = await Promise.all([
            listActivityDefinitions(),
            listVersionDefinitions(),
            listHashes()
        ])
        const raids = activities.filter(a => a.isRaid)
        const pantheonId = 101
        const pantheonVersions = versions.filter(v => v.associatedActivityId === pantheonId)

        return RaidHubRoute.ok({
            hashes: Object.fromEntries(
                hashes.map(h => [
                    h.hash,
                    {
                        activityId: h.activityId,
                        versionId: h.versionId
                    }
                ])
            ),
            activityDefinitions: Object.fromEntries(
                activities.map(({ id, ...data }) => [id, data])
            ),
            versionDefinitions: Object.fromEntries(versions.map(({ id, ...data }) => [id, data])),
            raidIds: raids.map(a => a.id),
            listedRaidIds: raids
                .filter(a => !a.isSunset)
                .map(a => a.id)
                .sort((a, b) => b - a),
            sunsetRaidIds: raids.filter(a => a.isSunset).map(a => a.id),
            prestigeRaidIds: [
                ...new Set(hashes.filter(h => h.versionId === 3).map(h => h.activityId))
            ],
            masterRaidIds: [
                ...new Set(hashes.filter(h => h.versionId === 4).map(h => h.activityId))
            ],
            contestRaidIds: raids.filter(a => a.contestEnd !== null).map(a => a.id),
            pantheonIds: [pantheonId],
            pantheonVersionIds: pantheonVersions.map(v => v.id)
        })
    }
})
