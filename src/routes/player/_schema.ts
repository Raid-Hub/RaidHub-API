import { z, zBigIntString } from "../../schema/zod"

export const playerRouterParams = z.object({
    membershipId: zBigIntString()
})
