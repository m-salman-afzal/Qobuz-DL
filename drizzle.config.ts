import "dotenv/config";
import {defineConfig} from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    out: "./be/infra/database/migrations",
    schema: "./be/infra/database/models/*",
    dbCredentials: {
        host: String(process.env["DB_HOST"]),
        port: Number(process.env["DB_PORT"]),
        user: String(process.env["DB_USER"]),
        password: String(process.env["DB_PASSWORD"]),
        database: String(process.env["DB_NAME"]),
        ssl: false
    },
    verbose: true,
    strict: true
});
