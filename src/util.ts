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
