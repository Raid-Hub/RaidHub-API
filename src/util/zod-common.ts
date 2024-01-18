import { z } from "zod"

export const zCount = ({ min = 1, max, def }: { min: number; max: number; def: number }) =>
    z.coerce.number().int().positive().min(min).max(max).default(def)

export const zPage = () => z.coerce.number().int().positive().default(1)

export const zDigitString = () => z.coerce.string().regex(/^\d+n?$/)

export const zBooleanString = () =>
    z.coerce
        .string()
        .transform(s => JSON.parse(s))
        .pipe(z.boolean())

export const zBigIntString = () => zDigitString().pipe(z.coerce.bigint())
