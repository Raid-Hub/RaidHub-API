import { z } from "zod"
import { zBigIntString } from "../../util/zod-common"

export const playerRouterParams = z.object({
    membershipId: zBigIntString()
})
