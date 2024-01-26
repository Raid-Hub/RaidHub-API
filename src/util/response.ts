import { RaidHubResponse } from "../RaidHubRouterTypes"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ok<T>(response: T, message?: string): RaidHubResponse<T, any> {
    return {
        minted: new Date(),
        message,
        response,
        success: true
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fail<E>(error: E, message?: string): RaidHubResponse<any, E> {
    return {
        minted: new Date(),
        message,
        error,
        success: false
    }
}
