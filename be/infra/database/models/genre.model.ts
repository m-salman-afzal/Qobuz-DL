import {relations} from "drizzle-orm";
import {integer, json, pgTable, varchar} from "drizzle-orm/pg-core";

import {albumModel} from "./album.model";
import {baseModel} from "./base.model";

export const genreModel = pgTable("genres", {
    ...baseModel("genre"),
    path: json().$type<number[]>(),
    color: varchar(),
    name: varchar(),
    id: integer().notNull().unique()
});

export const genreModelRelations = relations(genreModel, ({many}) => ({
    albums: many(albumModel)
}));
