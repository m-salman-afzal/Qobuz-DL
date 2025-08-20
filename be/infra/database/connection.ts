
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as models from "./models";

const client = createClient({
    url: process.env.DB_URL || "file:./local.sqlite"
});

export const db = drizzle(client, {
    schema: models
});
