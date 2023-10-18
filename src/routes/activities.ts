import express, { Request, Response } from "express"
import { openPostgresClient } from "../postgres"

export const activitiesRouter = express.Router()

activitiesRouter.get("/:destinyMembershipId", async (req: Request, res: Response) => {
    const membershipId = req.params.destinyMembershipId

    await openPostgresClient(async poolClient => {
        // poolClient.query("SELECT")
    })

    res.send(`Activities for membership ID ${membershipId}`)
})
