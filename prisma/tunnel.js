const { spawn } = require("child_process")

require("dotenv").config()

startTunnel()

function startTunnel() {
    if (!process.env.SSH_REMOTE_HOST) {
        console.error("SSH_REMOTE_HOST is not set")
        process.exit(1)
    }

    // spawn the child process
    const args = [
        "-L",
        `${process.env.POSTGRES_PORT}:localhost:5432`,
        "-o",
        "ProxyCommand=cloudflared access ssh --hostname %h",
        "-p",
        22,
        `${process.env.POSTGRES_USER}@${process.env.SSH_REMOTE_HOST}`
    ]

    spawn("ssh", args, {
        stdio: "inherit"
    })

    console.log("ssh", ...args)

    console.log(`Connecting to tunnel on ${process.env.SSH_REMOTE_HOST}...`)
}
