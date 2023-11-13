import fs from "fs"

export function appendToFile(
    { filePath, contents }: { filePath: string; contents: string },
    opts?: {
        dontAddNewLine?: boolean
    }
) {
    const fileDescriptor = fs.openSync(filePath, "a")
    fs.appendFileSync(fileDescriptor, opts?.dontAddNewLine ? contents : contents + "\n")
    fs.closeSync(fileDescriptor)
}
