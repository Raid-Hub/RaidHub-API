import jwt from "jsonwebtoken"
import { z } from "zod"
import { zDigitString } from "../schema/util"

const zJWTAuthFormat = z.object({
    isAdmin: z.boolean(),
    bungieMembershipId: zDigitString(),
    destinyMembershipIds: z.array(zDigitString())
})

export const generateJWT = ({
    isAdmin = false,
    bungieMembershipId,
    destinyMembershipIds,
    durationSeconds
}: {
    isAdmin: boolean
    bungieMembershipId: string
    destinyMembershipIds: string[]
    durationSeconds: number
}) =>
    jwt.sign(
        { isAdmin, bungieMembershipId, destinyMembershipIds } satisfies z.infer<
            typeof zJWTAuthFormat
        >,
        process.env.JWT_SECRET,
        {
            expiresIn: durationSeconds
        }
    )

export const canAccessPrivateProfile = async (
    destinyMembershipId: string | bigint,
    authHeader: string
) => {
    if (!authHeader) return false

    const [format, token] = authHeader ? authHeader.split(" ") : ["", ""]
    if (format !== "Bearer") return false

    try {
        return await new Promise<boolean>(resolve =>
            jwt.verify(token, process.env.JWT_SECRET!, (err, result) => {
                if (err) {
                    resolve(false)
                } else {
                    const data = zJWTAuthFormat.parse(result)
                    resolve(
                        data.isAdmin ||
                            data.destinyMembershipIds.includes(String(destinyMembershipId))
                    )
                }
            })
        )
    } catch (err) {
        // TODO: Log error
        console.error(err)
        return false
    }
}
