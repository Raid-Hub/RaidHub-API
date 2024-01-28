import { RaidHubHandlerReturn } from "../RaidHubRouterTypes"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ok<T>(response: T, message?: string): RaidHubHandlerReturn<T, any> {
    return {
        message,
        response,
        success: true
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fail<E>(error: E, message?: string): RaidHubHandlerReturn<any, E> {
    return {
        message,
        error,
        success: false
    }
}
