import { EnumLike, ZodNativeEnumDef, ZodStringDef, ZodType, z } from "zod"

export const zNaturalNumber = () => z.number().int().positive()

export const zWholeNumber = () => z.number().int().nonnegative()

export const zPage = () => z.coerce.number().int().positive().default(1)

export const zDigitString = () =>
    z.coerce.string().regex(/^\d+n?$/) as ZodType<string, ZodStringDef, string | number | bigint>

export const zBooleanString = () =>
    z
        .union([z.boolean(), z.string()])
        .transform(s => JSON.parse(String(s)))
        .pipe(z.boolean())
        .openapi({
            type: "boolean"
        })

export const zBigIntString = () => zDigitString().pipe(z.coerce.bigint())

export const zISODateString = () =>
    z.coerce.date().openapi({
        type: "string",
        format: "date-time"
    })

type MapToStrings<N extends number> = Record<`${N}`, N> & EnumLike

export const zNumberEnum = <T extends readonly number[]>(arr: T) => {
    const enumber = Object.fromEntries(arr.map(n => ["_" + n, n])) as MapToStrings<T[number]>
    return z.nativeEnum(enumber) as ZodType<
        T[number],
        ZodNativeEnumDef<MapToStrings<T[number]>>,
        number
    >
}
