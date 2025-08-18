import {relations} from "drizzle-orm";
import {integer, json, pgTable, varchar} from "drizzle-orm/pg-core";

import {albumModel} from "./album.model";
import {baseModel} from "./base.model";

export const artistModel = pgTable("artists", {
    ...baseModel("artist"),
    name: varchar(),
    id: integer().unique(),
    albumsCount: integer(),
    image: json().$type<{
        small: string;
        medium: string;
        large: string;
        extralarge: string;
        mega: string;
    } | null>()
});

export const artistModelRelations = relations(artistModel, ({many}) => ({
    albums: many(albumModel)
}));
