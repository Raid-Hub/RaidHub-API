import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { ZodStringDef, ZodType, z } from "zod"

extendZodWithOpenApi(z)
export { z }

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

export function zNumberEnum<T extends readonly number[]>(arr: T) {
    return z.number().refine(n => arr.includes(n)) as ZodType<T[number]>
}
