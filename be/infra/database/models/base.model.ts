import {integer, timestamp, uuid} from "drizzle-orm/pg-core";

export const baseModel = (modelName: string) => ({
    sId: integer().primaryKey().generatedAlwaysAsIdentity(),
    randId: uuid().unique(`${modelName}_randId_unique`).notNull().defaultRandom(),
    createdAt: timestamp("createdAt").defaultNow().notNull()
    // updatedAt: timestamp("updatedAt").notNull(),
    // deletedAt: timestamp("deletedAt")
});
