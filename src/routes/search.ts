import { Router } from "express"
import { success } from "~/util"
import { prisma } from "~/prisma"
import { cacheControl } from "~/middlewares/cache-control"
import { zodQueryParser } from "~/middlewares/parsers"
import { z } from "zod"
import { Player } from "@prisma/client"

export const searchRouter = Router()

searchRouter.use(cacheControl(600))

const SearchParams = z.object({
    count: z.coerce.number().int().min(0).max(50).default(20),
    query: z.string().min(1)
})

searchRouter.get("/", zodQueryParser(SearchParams), async (req, res, next) => {
    try {
        const { query, count } = req.query
        const data = await searchForPlayer(query, count)
        res.status(200).json(success(data))
    } catch (e) {
        next(e)
    }
})

async function searchForPlayer(query: string, count: number) {
    const searchTerm = query.trim().toLowerCase()

    // normalize last played by adding a month minimum
    const adjustedNow = Date.now() + 1000 * 60 * 60 * 24 * 30
    const sortResults = (a: Player, b: Player) => {
        const aMatch = a.bungieGlobalDisplayName?.toLowerCase() === searchTerm
        const bMatch = b.bungieGlobalDisplayName?.toLowerCase() === searchTerm

        // @ts-ignore
        if (aMatch ^ bMatch) {
            return aMatch ? -1 : 1
        } else {
            const timeDifferenceA = adjustedNow - a.lastSeen.getTime()
            const timeDifferenceB = adjustedNow - b.lastSeen.getTime()
            return timeDifferenceA / (a.clears || 1) - timeDifferenceB / (b.clears || 1)
        }
    }

    const take = count * 2
    async function searchGlobal() {
        const [globalDisplayName, globalDisplayNameCode] = searchTerm.split("#")
        const results = await prisma.player
            .findMany({
                where: {
                    bungieGlobalDisplayName: {
                        equals: globalDisplayName,
                        mode: "insensitive"
                    },
                    bungieGlobalDisplayNameCode: {
                        startsWith: globalDisplayNameCode
                    }
                },
                take: take
            })
            .then(res => res.sort(sortResults))

        return {
            params: {
                count: count,
                term: {
                    bungieGlobalDisplayName: globalDisplayName,
                    bungieGlobalDisplayNameCode: globalDisplayNameCode
                }
            },
            results: results.map(r => ({
                ...r,
                membershipId: String(r.membershipId)
            }))
        }
    }

    async function searchDisplay() {
        const results = await prisma.player
            .findMany({
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
                    displayName: searchTerm,
                    bungieGlobalDisplayName: searchTerm
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
