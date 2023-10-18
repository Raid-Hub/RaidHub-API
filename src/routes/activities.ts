import express, { Request, Response } from "express"
import { openPostgresClient } from "../postgres"

export const activitiesRouter = express.Router()

activitiesRouter.get("/:destinyMembershipId", async (req: Request, res: Response) => {
    const membershipId = req.params.destinyMembershipId

    await openPostgresClient(async client => {
        const data = await client.query("SELECT * FROM raw_pgcr")

        console.log(data)

        res.send(`Activities for membership ID: ${data.rows.map(r => r["_id"])}`)
    })
})
