import {relations} from "drizzle-orm";
import {integer, pgTable, varchar} from "drizzle-orm/pg-core";

import {albumModel} from "./album.model";
import {baseModel} from "./base.model";

export const labelModel = pgTable("labels", {
    ...baseModel("label"),
    name: varchar(),
    id: integer().notNull().unique(),
    albumsCount: integer()
});

export const labelModelRelations = relations(labelModel, ({many}) => ({
    albums: many(albumModel)
}));
