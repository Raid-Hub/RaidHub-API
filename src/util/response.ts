import { RaidHubResponse } from "../RaidHubRouterTypes"

export function ok<T>(response: T, message?: string): RaidHubResponse<T, any> {
    return {
        minted: new Date(),
        message,
        response,
        success: true
    }
}

export function fail<E>(error: E, message?: string): RaidHubResponse<any, E> {
    return {
        minted: new Date(),
        message,
        error,
        success: false
    }
}
