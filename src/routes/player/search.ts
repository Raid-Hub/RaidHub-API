import { Prisma } from "@prisma/client"
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
        const { searchTerm, results } = await searchForPlayer(query, count)
        return ok({
            params: { count, query: searchTerm },
            results
        })
    },
    response: {
        success: {
            statusCode: 200,
            schema: z
                .object({
                    params: z.object({
                        count: zPositiveInt(),
                        query: z.string()
                    }),
                    results: z.array(zPlayerInfo.extend({ clears: z.number().int().nonnegative() }))
                })
                .strict()
        }
    }
})

async function searchForPlayer(query: string, count: number) {
    const searchTerm = query.trim().toLowerCase()
    let results = await search(searchTerm, count)
    if (!results.length) {
        results = await search(searchTerm, count, true)
    }
    return {
        searchTerm,
        results
    }
}

const searchDisplay = Prisma.sql`WHERE lower(display_name)`
const searchGlobal = Prisma.sql`WHERE lower(bungie_name)`
async function search(searchTerm: string, count: number, byDisplayName: boolean = false) {
    const results = await prisma.$queryRaw<
        {
            membership_id: string
            membership_type: number
            bungie_global_display_name: string
            bungie_global_display_name_code: string
            display_name: string
            last_seen: Date
            icon_path: string
            clears: number
        }[]
    >`SELECT 
        membership_id,
        membership_type,
        bungie_global_display_name,
        bungie_global_display_name_code,
        display_name,
        last_seen,
        icon_path,
        clears
    FROM player 
    ${byDisplayName ? searchDisplay : searchGlobal} LIKE ${searchTerm + "%"} 
        AND last_seen > TIMESTAMP 'epoch'
    ORDER BY _search_score DESC 
    LIMIT ${count};`

    return results.map(r => ({
        membershipId: r.membership_id,
        membershipType: r.membership_type,
        bungieGlobalDisplayName: r.bungie_global_display_name,
        bungieGlobalDisplayNameCode: r.bungie_global_display_name_code,
        lastSeen: r.last_seen,
        displayName: r.display_name,
        iconPath: r.icon_path,
        clears: r.clears
    }))
}
