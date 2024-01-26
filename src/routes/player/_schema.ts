import { z, zBigIntString } from "../../util/zod"

export const playerRouterParams = z.object({
    membershipId: zBigIntString()
})
