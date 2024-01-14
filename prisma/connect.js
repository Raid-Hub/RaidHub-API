const { exec } = require("child_process")

require("dotenv").config()

startTunnel()

function startTunnel() {
    if (!process.env.SSH_REMOTE_HOST) {
        console.error("SSH_REMOTE_HOST is not set")
        process.exit(1)
    }

    const sshCommand = `ssh -ttL ${process.env.POSTGRES_PORT}:localhost:5432 -o "ProxyCommand=/usr/local/bin/cloudflared access ssh --hostname %h" -p 22 ${process.env.POSTGRES_USER}@${process.env.SSH_REMOTE_HOST}`
    const sshProcess = exec(sshCommand)
    console.log(sshCommand)

    sshProcess.on("disconnect", () => console.log("Disconnected from SSH tunnel"))
    sshProcess.on("close", (code, signal) => console.log(`Tunnel closed.`))
    sshProcess.on("exit", (code, signal) =>
        console.log(`Tunnel exiting with code ${code} and signal ${signal}...`)
    )

    let success = false
    sshProcess.stdout.on("data", () => {
        if (!success) {
            console.log("SSH tunnel started. Press Ctrl+C to stop.")
            success = true
        }
    })
    sshProcess.stderr.on("data", data => console.error("\n", data.toString()))

    process.on("SIGINT", () => {
        console.log("\nStopping SSH tunnel...")
        sshProcess.kill()
    })

    console.log(`Connecting to tunnel on ${process.env.SSH_REMOTE_HOST}...`)
}
