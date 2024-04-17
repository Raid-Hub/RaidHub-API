import { includedIn } from "../util/helpers"
import { Activity, ContestRaid, ContestRaids, ListedRaid, MasterRaid, PrestigeRaid } from "./raids"

export function isDayOne(raid: ListedRaid, ended: Date): boolean {
    return ended.getTime() < DayOneEnd[raid]
}

export function isContest(raid: ListedRaid, started: Date): boolean {
    if (!includedIn(ContestRaids, raid)) return false
    return started.getTime() < ContestEnd[raid]
}

export function isWeekOne(raid: ListedRaid, ended: Date): boolean {
    if (includedIn(ContestRaids, raid)) return false
    return ended.getTime() < WeekOneEnd[raid]
}

export const ReleaseDate: Record<ListedRaid, number> = {
    [Activity.LEVIATHAN]: new Date("September 13, 2017 10:00:00 AM PDT").getTime(),
    [Activity.EATER_OF_WORLDS]: new Date("December 8, 2017 10:00:00 AM PST").getTime(),
    [Activity.SPIRE_OF_STARS]: new Date("May 11, 2018 10:00:00 AM PDT").getTime(),
    [Activity.LAST_WISH]: new Date("September 14, 2018 10:00:00 AM PDT").getTime(),
    [Activity.SCOURGE_OF_THE_PAST]: new Date("December 7, 2018 9:00:00 AM PST").getTime(),
    [Activity.CROWN_OF_SORROW]: new Date("June 4, 2019 4:00:00 PM PDT").getTime(),
    [Activity.GARDEN_OF_SALVATION]: new Date("October 5, 2019 10:00:00 AM PDT").getTime(),
    [Activity.DEEP_STONE_CRYPT]: new Date("November 21, 2020 10:00:00 AM PST").getTime(),
    [Activity.VAULT_OF_GLASS]: new Date("May 22, 2021 10:00:00 AM PDT").getTime(),
    [Activity.VOW_OF_THE_DISCIPLE]: new Date("March 5, 2022 10:00:00 AM PST").getTime(),
    [Activity.KINGS_FALL]: new Date("August 26, 2022 10:00:00 AM PDT").getTime(),
    [Activity.ROOT_OF_NIGHTMARES]: new Date("March 10, 2023 9:00:00 AM PST").getTime(),
    [Activity.CROTAS_END]: new Date("September 1, 2023 10:00:00 AM PDT").getTime()
}

const DayOneEnd: Record<ListedRaid, number> = {
    [Activity.LEVIATHAN]: new Date("September 14, 2017 10:00:00 AM PDT").getTime(),
    [Activity.EATER_OF_WORLDS]: new Date("December 9, 2017 10:00:00 AM PST").getTime(),
    [Activity.SPIRE_OF_STARS]: new Date("May 12, 2018 10:00:00 AM PDT").getTime(),
    [Activity.LAST_WISH]: new Date("September 15, 2018 10:00:00 AM PDT").getTime(),
    [Activity.SCOURGE_OF_THE_PAST]: new Date("December 8, 2018 9:00:00 AM PST").getTime(),
    [Activity.CROWN_OF_SORROW]: new Date("June 5, 2019 4:00:00 PM PDT").getTime(),
    [Activity.GARDEN_OF_SALVATION]: new Date("October 6, 2019 10:00:00 AM PDT").getTime(),
    [Activity.DEEP_STONE_CRYPT]: new Date("November 22, 2020 10:00:00 AM PST").getTime(),
    [Activity.VAULT_OF_GLASS]: new Date("May 23, 2021 10:00:00 AM PDT").getTime(),
    [Activity.VOW_OF_THE_DISCIPLE]: new Date("March 6, 2022 10:00:00 AM PST").getTime(),
    [Activity.KINGS_FALL]: new Date("August 27, 2022 10:00:00 AM PDT").getTime(),
    [Activity.ROOT_OF_NIGHTMARES]: new Date("March 11, 2023 9:00:00 AM PST").getTime(),
    [Activity.CROTAS_END]: new Date("September 2, 2023 10:00:00 AM PDT").getTime()
}

const ContestEnd: Record<ContestRaid, number> = {
    [Activity.CROWN_OF_SORROW]: new Date("June 5, 2019 4:00:00 PM PDT").getTime(),
    [Activity.GARDEN_OF_SALVATION]: new Date("October 6, 2019 10:00:00 AM PDT").getTime(),
    [Activity.DEEP_STONE_CRYPT]: new Date("November 22, 2020 10:00:00 AM PST").getTime(),
    [Activity.VAULT_OF_GLASS]: new Date("May 23, 2021 10:00:00 AM PDT").getTime(),
    [Activity.VOW_OF_THE_DISCIPLE]: new Date("March 7, 2022 10:00:00 AM PST").getTime(),
    [Activity.KINGS_FALL]: new Date("August 27, 2022 10:00:00 AM PDT").getTime(),
    [Activity.ROOT_OF_NIGHTMARES]: new Date("March 12, 2023 9:00:00 AM PST").getTime(),
    [Activity.CROTAS_END]: new Date("September 3, 2023 10:00:00 AM PDT").getTime()
}

const WeekOneEnd: Record<Exclude<ListedRaid, ContestRaid>, number> = {
    [Activity.LEVIATHAN]: new Date("September 19, 2017 10:00:00 AM PDT").getTime(),
    [Activity.EATER_OF_WORLDS]: new Date("December 12th, 2017 10:00:00 AM PST").getTime(),
    [Activity.SPIRE_OF_STARS]: new Date("May 15, 2018 10:00:00 AM PDT").getTime(),
    [Activity.LAST_WISH]: new Date("September 18, 2018 10:00:00 AM PDT").getTime(),
    [Activity.SCOURGE_OF_THE_PAST]: new Date("December 11, 2018 9:00:00 AM PST").getTime()
}

export const PrestigeReleases: Record<PrestigeRaid, number> = {
    [Activity.LEVIATHAN]: new Date("October 18, 2017 1:00:00 PM EDT").getTime(),
    [Activity.EATER_OF_WORLDS]: new Date("July 17, 2018 1:00:00 PM EDT").getTime(),
    [Activity.SPIRE_OF_STARS]: new Date("July 18, 2018 1:00:00 PM EDT").getTime()
}

export const MasterReleases: Record<MasterRaid, number> = {
    [Activity.VAULT_OF_GLASS]: new Date("July 6, 2021 1:00:00 PM EDT").getTime(),
    [Activity.VOW_OF_THE_DISCIPLE]: new Date("April 19, 2022 1:00:00 PM EDT").getTime(),
    [Activity.KINGS_FALL]: new Date("September 20, 2022 1:00:00 PM EDT").getTime(),
    [Activity.ROOT_OF_NIGHTMARES]: new Date("March 28, 2023 1:00:00 PM EDT").getTime(),
    [Activity.CROTAS_END]: new Date("September 21, 2023 1:00:00 PM EDT").getTime()
}
