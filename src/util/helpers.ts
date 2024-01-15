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

export function groupBy<T, K extends keyof T, V extends number | string>(
    obj: (T & { [k in K]: V })[],
    key: K,
    remove: boolean = false
) {
    return obj.reduce(
        (rv, x) => {
            ;(rv[x[key]] = rv[x[key]] || []).push(x)
            if (remove) delete x[key]
            return rv
        },
        {} as Partial<Record<V, Omit<T, K>[]>>
    )
}
