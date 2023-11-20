import { Router } from "express"
import { success } from "~/util"
import { prisma } from "~/prisma"
import { cacheControl } from "~/middlewares/cache-control"
import { zodQueryParser } from "~/middlewares/parsers"
import { z } from "zod"

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

async function searchForPlayer(query: string, take: number) {
    const searchTerm = decodeURIComponent(query).trim()

    if (searchTerm.includes("#")) {
        const [displayName, code] = searchTerm.split("#")
        const results = await prisma.player.findMany({
            where: {
                bungieGlobalDisplayName: {
                    equals: displayName,
                    mode: "insensitive"
                },
                bungieGlobalDisplayNameCode: {
                    contains: code
                }
            },
            take: take
        })
        return {
            params: {
                count: take,
                term: {
                    bungieGlobalDisplayName: displayName,
                    bungieGlobalDisplayNameCode: code
                }
            },
            results: results.map(r => ({
                ...r,
                membershipId: String(r.membershipId)
            }))
        }
    } else {
        const results = await prisma.player.findMany({
            where: {
                OR: [
                    {
                        bungieGlobalDisplayName: {
                            contains: searchTerm,
                            mode: "insensitive"
                        }
                    },
                    {
                        displayName: {
                            contains: searchTerm,
                            mode: "insensitive"
                        }
                    }
                ]
            },
            orderBy: {
                clears: "desc"
            },
            take: take
        })

        return {
            params: {
                count: take,
                term: {
                    displayName: searchTerm
                }
            },
            // sort by a combination of last played and clears
            results: results
                .sort((a, b) => {
                    const aMatch = a.bungieGlobalDisplayName === searchTerm
                    const bMatch = b.bungieGlobalDisplayName === searchTerm

                    // @ts-ignore
                    if (aMatch ^ bMatch) {
                        return aMatch ? -1 : 1
                    } else {
                        const now = Date.now()
                        const monthsTime = 2592000000
                        // normalize last played by adding a month minimum
                        const timeDifferenceA = monthsTime + now - new Date(a.lastSeen).getTime()
                        const timeDifferenceB = monthsTime + now - new Date(b.lastSeen).getTime()
                        return timeDifferenceA / (a.clears || 1) - timeDifferenceB / (b.clears || 1)
                    }
                })
                .map(r => ({
                    ...r,
                    membershipId: String(r.membershipId)
                }))
        }
    }
}
