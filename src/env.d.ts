declare module "bun" {
    interface Env {
        API_KEYS_PATH: string
        ADMIN_CLIENT_SECRET: string
        JWT_SECRET: string
        DATABASE_URL: string
        PROD?: boolean
        PORT?: number
    }
}
