import { z } from "zod"

export function success<T>(data: T, message?: string) {
    return {
        minted: Date.now(),
        message,
        response: data,
        success: true
    }
}

export function failure<T>(data: T, message?: string) {
    return {
        minted: Date.now(),
        message,
        error: data,
        success: false
    }
}

export function includedIn<T>(arr: readonly T[], element: any): element is T {
    return arr.includes(element)
}

export const numberString = z.coerce.string().regex(/^\d+$/)

export const bigIntString = numberString.transform(BigInt)
