import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { EnumLike, ZodNativeEnumDef, ZodStringDef, ZodType, z } from "zod"

extendZodWithOpenApi(z)
export { z }

export const zPositiveInt = () => z.number().int().positive()

export const zCount = ({ min = 1, max, def }: { min: number; max: number; def: number }) =>
    z.coerce.number().int().positive().min(min).max(max).default(def)

export const zPage = () => z.coerce.number().int().positive().default(1)

export const zDigitString = () =>
    z.coerce.string().regex(/^\d+n?$/) as ZodType<string, ZodStringDef, string | number | bigint>

export const zBooleanString = () =>
    (z.coerce.string() as ZodType<string, ZodStringDef, string | boolean>)
        .transform(s => JSON.parse(s))
        .pipe(z.boolean())

export const zBigIntString = () => zDigitString().pipe(z.coerce.bigint())

export const zISODateString = () =>
    z
        .date()
        .transform(d => d.toISOString())
        .openapi({
            param: {
                schema: {
                    type: "string",
                    format: "date-time"
                }
            }
        })

type MapToStrings<N extends number> = Record<`${N}`, N> & EnumLike

export function zNumberEnum<T extends readonly number[]>(arr: T) {
    const enumber = Object.fromEntries(arr.map(n => ["_" + n, n])) as MapToStrings<T[number]>
    return z.nativeEnum(enumber) as ZodType<
        T[number],
        ZodNativeEnumDef<MapToStrings<T[number]>>,
        number
    >
}
