import { ZodStringDef, ZodType, z } from "zod"

export const zNaturalNumber = () => z.number().int().positive()

export const zWholeNumber = () => z.number().int().nonnegative()

export const zPage = () => z.coerce.number().int().positive().default(1)

export const zDigitString = () =>
    z.coerce.string().regex(/^\d+n?$/) as ZodType<string, ZodStringDef, string | number | bigint>

export const zBigIntString = () => zDigitString().pipe(z.coerce.bigint())

export const zISODateString = () =>
    z.coerce.date().openapi({
        type: "string",
        format: "date-time"
    })
