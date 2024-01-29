import { RaidHubHandlerReturn } from "../RaidHubRouterTypes"

export function ok<T>(response: T, message?: string): RaidHubHandlerReturn<T, never, never> {
    return {
        message,
        response,
        success: true
    }
}

export function fail<E, C extends string>(
    error: E,
    type: C,
    message?: string
): RaidHubHandlerReturn<never, E, C> {
    return {
        message,
        error,
        success: false,
        type: type
    }
}
