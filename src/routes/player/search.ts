import { Player } from "@prisma/client"
import { RaidHubRoute } from "../../RaidHubRoute"
import { cacheControl } from "../../middlewares/cache-control"
import { zPlayerInfo } from "../../schema/common"
import { z, zCount, zPositiveInt } from "../../schema/zod"
import { prisma } from "../../services/prisma"
import { ok } from "../../util/response"

export const playerSearchRoute = new RaidHubRoute({
    method: "get",
    query: z.object({
        count: zCount({ min: 0, max: 50, def: 20 }),
        query: z.string().min(1)
    }),
    middlewares: [cacheControl(60)],
    async handler(req) {
        const { query, count } = req.query
        const data = await searchForPlayer(query, count)
        return ok(data)
    },
    response: {
        success: z
            .object({
                params: z.object({
                    count: zPositiveInt(),
                    term: z.object({
                        name: z.string(),
                        nameWithCode: z.string().nullable()
                    })
                }),
                results: z.array(zPlayerInfo.extend({ clears: z.number().int().nonnegative() }))
            })
            .strict()
    }
})

async function searchForPlayer(query: string, count: number) {
    const searchTerm = query.trim().toLowerCase()

    const select = {
        bungieGlobalDisplayName: true,
        bungieGlobalDisplayNameCode: true,
        lastSeen: true,
        displayName: true,
        membershipId: true,
        iconPath: true,
        membershipType: true,
        clears: true
    } as const

    // normalize last played by adding a month minimum
    const adjustedNow = Date.now() + 1000 * 60 * 60 * 24 * 30
    const sortResults = (
        a: Pick<Player, keyof typeof select>,
        b: Pick<Player, keyof typeof select>
    ) => {
        const aMatch = a.bungieGlobalDisplayName?.toLowerCase() === searchTerm
        const bMatch = b.bungieGlobalDisplayName?.toLowerCase() === searchTerm

        // @ts-expect-error ts does not like bitwise operators on booleans
        if (aMatch ^ bMatch) {
            return aMatch ? -1 : 1
        } else {
            const timeDifferenceA = adjustedNow - a.lastSeen.getTime()
            const timeDifferenceB = adjustedNow - b.lastSeen.getTime()
            return timeDifferenceA / (a.clears || 1) - timeDifferenceB / (b.clears || 1)
        }
    }
    async function searchGlobal() {
        const [globalDisplayName, globalDisplayNameCode] = searchTerm.split("#")
        const results = await prisma.player
            .findMany({
                select: select,
                where: {
                    bungieGlobalDisplayName: {
                        equals: globalDisplayName,
                        mode: "insensitive"
                    },
                    bungieGlobalDisplayNameCode: {
                        startsWith: globalDisplayNameCode.slice(0, 4)
                    }
                },
                take: count
            })
            .then(res => res.sort(sortResults))

        return {
            params: {
                count: count,
                term: {
                    name: globalDisplayName,
                    nameWithCode: globalDisplayName + "#" + globalDisplayNameCode.slice(0, 4)
                }
            },
            results: results.map(r => ({
                ...r,
                membershipId: String(r.membershipId)
            }))
        }
    }

    async function searchDisplay() {
        const take = count * 2
        const results = await prisma.player
            .findMany({
                select: select,
                where: {
                    bungieGlobalDisplayName: {
                        startsWith: searchTerm,
                        mode: "insensitive"
                    }
                },
                orderBy: {
                    clears: "desc"
                },
                take: take
            })
            .then(res => res.sort(sortResults))

        if (results.length < count) {
            const more = await prisma.player
                .findMany({
                    where: {
                        displayName: {
                            contains: searchTerm,
                            mode: "insensitive"
                        },
                        NOT: {
                            bungieGlobalDisplayName: {
                                startsWith: searchTerm,
                                mode: "insensitive"
                            }
                        }
                    },
                    orderBy: {
                        clears: "desc"
                    },
                    take: take - results.length
                })
                .then(res => res.sort(sortResults))
            results.push(...more)
        }

        return {
            params: {
                count: take,
                term: {
                    name: searchTerm,
                    nameWithCode: null
                }
            },
            // sort by a combination of last played and clears
            results: results.slice(0, count).map(r => ({
                ...r,
                membershipId: String(r.membershipId)
            }))
        }
    }

    return searchTerm.includes("#") ? searchGlobal() : searchDisplay()
}
