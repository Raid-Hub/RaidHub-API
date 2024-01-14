const { exec } = require("child_process")

require("dotenv").config()

startTunnel()

function startTunnel() {
    if (!process.env.RAIDHUB_DB_HOST) {
        console.error("RAIDHUB_DB_HOST is not set")
        process.exit(1)
    }

    const sshCommand = `ssh -L 5432:localhost:5432 root@${process.env.RAIDHUB_DB_HOST}`
    const sshProcess = exec(sshCommand)

    sshProcess.on("spawn", () => console.log("SSH tunnel started. Press Ctrl+C to stop."))
    sshProcess.on("close", onExit)
    sshProcess.on("error", onExit)

    process.on("SIGINT", () => {
        console.log("\nStopping SSH tunnel...")
        sshProcess.kill()
    })

    console.log(`Connecting to tunnel on ${process.env.RAIDHUB_DB_HOST}...`)
}

function onExit() {
    console.log("Closed.")
}
