import { RaidHubRouter } from "../../RaidHubRouter"
import { weeklyWeaponMetaRoute } from "./weeklyWeaponMeta"

export const metricsRouter = new RaidHubRouter({
    routes: [{ path: "/weekly/weapons", route: weeklyWeaponMetaRoute }]
})
