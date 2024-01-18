const { spawn } = require("child_process")
const net = require("net")

require("dotenv").config()

startTunnel()

function startTunnel() {
    if (!process.env.SSH_REMOTE_HOST) {
        console.error("SSH_REMOTE_HOST is not set")
        process.exit(1)
    }

    // spawn the child process
    const args = [
        "-NL",
        `${process.env.POSTGRES_PORT}:localhost:5432`,
        "-o",
        "ProxyCommand=cloudflared access ssh --hostname %h",
        "-p",
        22,
        `${process.env.POSTGRES_USER}@${process.env.SSH_REMOTE_HOST}`
    ]

    console.log("ssh", ...args)

    const childProcess = spawn("ssh", args, { stdio: "inherit" })

    childProcess.on("spawn", () => {
        console.log(`Connecting to tunnel on ${process.env.SSH_REMOTE_HOST}`)
    })

    let attempts = 0
    const interval = setInterval(() => {
        const client = net.createConnection(
            { port: process.env.POSTGRES_PORT, host: "localhost" },
            () => {
                console.log("Tunnel created")
                client.end()
                clear()
            }
        )

        client.on("error", err => {
            if (err.code === "ECONNREFUSED") {
                if (attempts < 5) {
                    ++attempts
                } else {
                    console.error(err.errors[1])
                    console.error("Tunnel could not be created. Do you have cloudflared installed?")
                    clear()
                    childProcess.kill()
                }
            } else {
                console.error(err)
            }
        })
    }, 1000)

    function clear() {
        clearInterval(interval)
    }
}
