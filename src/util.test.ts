import { expect } from "bun:test"

export const expectOk = (
    result:
        | {
              readonly type: "ok"
              readonly parsed: unknown
          }
        | {
              readonly type: "err"
              readonly parsed: unknown
          }
) => {
    if (result.type === "err") {
        expect(result.parsed).toBe(null)
    }
    expect(result.type).toBe("ok")
}

export const expectErr = (
    result:
        | {
              readonly type: "ok"
              readonly parsed: unknown
          }
        | {
              readonly type: "err"
              readonly parsed: unknown
          }
) => {
    if (result.type === "ok") {
        expect(result.parsed).toBe(null)
    }
    expect(result.type).toBe("err")
}
