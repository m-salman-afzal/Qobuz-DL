import {relations} from "drizzle-orm";
import {integer, json, pgTable, uuid, varchar} from "drizzle-orm/pg-core";

import {artistModel} from "./artist.model";
import {baseModel} from "./base.model";
import {genreModel} from "./genre.model";
import {labelModel} from "./label.model";
import {trackModel} from "./track.model";

export const albumModel = pgTable("albums", {
    ...baseModel("album"),
    maximumBitDepth: integer(),
    imageSmall: varchar(),
    imageThumbnail: varchar(),
    imageLarge: varchar(),
    imageBack: varchar(),
    artistId: uuid()
        .references(() => artistModel.randId),
    artists: json()
        .$type<
            {
                id: number;
                name: string;
                roles: string[];
            }[]
        >(),
    releasedAt: integer(),
    labelId: uuid()
        .references(() => labelModel.randId),
    title: varchar(),
    id: integer().notNull().unique(),
    version: varchar(),
    duration: integer(),
    parentalWarning: integer(), // 0 = false, 1 = true
    tracksCount: integer(),
    genreId: uuid()
        
        .references(() => genreModel.randId),
    qobuzStringId: varchar(),
    maximumSamplingRate: varchar(),
    releaseDateOriginal: varchar(),
    hires: integer(), // 0 = false, 1 = true
    upc: varchar(),
    streamable: integer() // 0 = false, 1 = true
});

export const albumModelRelations = relations(albumModel, ({one, many}) => ({
    artist: one(artistModel, {
        fields: [albumModel.artistId],
        references: [artistModel.randId]
    }),
    label: one(labelModel, {
        fields: [albumModel.labelId],
        references: [labelModel.randId]
    }),
    genre: one(genreModel, {
        fields: [albumModel.genreId],
        references: [genreModel.randId]
    }),
    tracks: many(trackModel)
}));
