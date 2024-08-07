declare module "bun" {
    interface Env {
        POSTGRES_USER: string
        POSTGRES_PASSWORD: string
        API_KEYS_PATH: string
        ADMIN_CLIENT_SECRET: string
        CLIENT_SECRET: string
        JWT_SECRET: string
        PROD?: boolean
        PORT?: number
    }
}
