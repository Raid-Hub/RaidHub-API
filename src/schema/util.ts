import { ZodStringDef, ZodType, z } from "zod"

export const zNaturalNumber = () => z.number().int().positive()

export const zWholeNumber = () => z.number().int().nonnegative()

export const zPage = () => z.coerce.number().int().positive().default(1)

export const zISODateString = () =>
    z.coerce.date().openapi({
        type: "string",
        format: "date-time"
    })

// Intended to be used as an input param
export const zDigitString = () =>
    z.coerce.string().regex(/^\d+n?$/) as ZodType<string, ZodStringDef, bigint | number | string>

// Intended to be used as an input param that will be coerced to a BigInt
export const zBigIntString = () => zDigitString().pipe(z.coerce.bigint())

// Intended to be used as an output param for a BigInt
export const zInt64 = () =>
    z.string().regex(/^\d+/).openapi({
        type: "string",
        format: "int64"
    })

// Intended to be used as an output param for a UInt32
export const zUInt32 = () =>
    z.number().int().nonnegative().openapi({
        format: "uint32"
    })
