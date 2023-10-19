import express, { Request, Response } from "express"
import { openPostgresClient } from "../postgres"

export const activitiesRouter = express.Router()

activitiesRouter.get("/:destinyMembershipId", async (req: Request, res: Response) => {
    const membershipId = req.params.destinyMembershipId

    await openPostgresClient(async client => {
        const data = await client.query(
            "SELECT activities.* FROM activities JOIN activity_players ON activities.activity_id = activity_players.activity_id WHERE activity_players.membership_id = $1",
            [membershipId]
        )

        console.log(data)

        res.status(200).json(data.rows)
    })
})
