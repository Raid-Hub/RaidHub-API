import { Router } from "express"
import { failure, success } from "~/util"
import { prisma } from "~/prisma"

export const searchRouter = Router()

searchRouter.use((_, res, next) => {
    // cache for 10 mins
    res.setHeader("Cache-Control", "max-age=600")
    next()
})

searchRouter.get("", async (req, res) => {
    try {
        const query = req.query.query
        let count: number | undefined = Number(req.query.count)
        if (Number.isNaN(count)) {
            count = undefined
        }
        const data = await searchForPlayer(String(query), count)
        res.status(200).json(success(data))
    } catch (e) {
        console.error(e)
        res.status(500).json(failure(e, "Internal server error"))
    }
})

async function searchForPlayer(query: string, count?: number) {
    const searchTerm = decodeURIComponent(query).trim()
    const take = Math.max(0, Math.min(count ?? 20, 50))

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
            take: count
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
