import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config()

export const prisma = new PrismaClient({
    log: ["warn", "error"]
})
