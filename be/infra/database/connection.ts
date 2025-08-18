
import {drizzle} from "drizzle-orm/node-postgres";

import * as models from "./models";

export const db = drizzle({
    connection: {
        host: process.env.DB_HOST!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
        port: Number(process.env.DB_PORT!)
    },
    schema: models
});
