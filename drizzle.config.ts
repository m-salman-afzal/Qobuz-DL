import "dotenv/config";
import {defineConfig} from "drizzle-kit";

export default defineConfig({
    dialect: "sqlite",
    out: "./be/infra/database/migrations",
    schema: "./be/infra/database/models/*",
    dbCredentials: {
        url: process.env.DB_URL || "file:./local.sqlite"
    },
    verbose: true,
    strict: true
});
