import { z } from "zod"
import { registry } from ".."

export enum ErrorCode {
    Unknown = "Unknown",
    /** Unauthorized */
    ApiKeyError = "ApiKeyError",
    /** Generic */
    PathValidationError = "PathValidationError",
    QueryValidationError = "QueryValidationError",
    BodyValidationError = "BodyValidationError",
    /** Specific */
    PlayerNotFoundError = "PlayerNotFoundError",
    PlayerPrivateProfileError = "PlayerPrivateProfileError",
    InstanceNotFoundError = "InstanceNotFoundError",
    PGCRNotFoundError = "PGCRNotFoundError",
    LeaderboardNotFoundError = "LeaderboardNotFoundError",
    PlayerNotOnLeaderboardError = "PlayerNotOnLeaderboardError",
    RaidNotFoundError = "RaidNotFoundError",
    PantheonVersionNotFoundError = "PantheonVersionNotFoundError",
    InvalidActivityVersionComboError = "InvalidActivityVersionComboError",
    AdminQuerySyntaxError = "AdminQuerySyntaxError",
    /** Auth */
    InsufficientPermissionsError = "InsufficientPermissionsError",
    InvalidClientSecretError = "InvalidClientSecretError",
    /** RaidHub error */
    InternalServerError = "InternalServerError"
}

export const zErrorCode = registry.register("ErrorCode", z.nativeEnum(ErrorCode))
