import { BungieNetResponse, PlatformErrorCodes } from "bungie-net-core/models"

export class BungieApiError<E extends PlatformErrorCodes> extends Error {
    public readonly code: PlatformErrorCodes
    public readonly cause: BungieNetResponse<unknown>
    public readonly url: URL
    constructor(
        message: string,
        { code, cause, url }: { code: E; cause: BungieNetResponse<unknown>; url: URL }
    ) {
        super(message)
        this.cause = cause
        this.code = code
        this.url = url
    }
}
