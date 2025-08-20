import {relations} from "drizzle-orm";
import {integer, text, sqliteTable} from "drizzle-orm/sqlite-core";

import {artistModel} from "./artist.model";
import {baseModel} from "./base.model";
import {genreModel} from "./genre.model";
import {labelModel} from "./label.model";
import {trackModel} from "./track.model";

export const albumModel = sqliteTable("albums", {
    ...baseModel("album"),
    maximumBitDepth: integer(),
    imageSmall: text(),
    imageThumbnail: text(),
    imageLarge: text(),
    imageBack: text(),
    artistId: text()
        .references(() => artistModel.randId),
    artists: text({ mode: "json" })
        .$type<
            {
                id: number;
                name: string;
                roles: string[];
            }[]
        >(),
    releasedAt: integer(),
    labelId: text()
        .references(() => labelModel.randId),
    title: text(),
    id: integer().notNull().unique(),
    version: text(),
    duration: integer(),
    parentalWarning: integer(), // 0 = false, 1 = true
    tracksCount: integer(),
    genreId: text()
        .references(() => genreModel.randId),
    qobuzStringId: text(),
    maximumSamplingRate: text(),
    releaseDateOriginal: text(),
    hires: integer(), // 0 = false, 1 = true
    upc: text(),
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
