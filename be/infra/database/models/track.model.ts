import {relations} from "drizzle-orm";
import { integer, text, sqliteTable} from "drizzle-orm/sqlite-core";

import {albumModel} from "./album.model";
import {baseModel} from "./base.model";
export const trackModel = sqliteTable("tracks", {
    ...baseModel("track"),
    isrc: text(),
    copyright: text(),
    maximumBitDepth: integer(),
    maximumSamplingRate: text(),
    performer: text({ mode: "json" })
        .$type<{
            name: string;
            id: number;
        }>(),
    composer: text({ mode: "json" }).$type<{
        name: string;
        id: number;
    } | null>(),
    albumId: text()
        .references(() => albumModel.randId),
    trackNumber: integer(),
    releasedAt: integer(),
    title: text(),
    version: text(),
    duration: integer(),
    parentalWarning: integer(), // 0 = false, 1 = true
    id: integer().notNull().unique(),
    hires: integer(), // 0 = false, 1 = true
    streamable: integer(), // 0 = false, 1 = true
    mediaNumber: integer(),
    downloadUrl: text(),
    uploadStatus: text().default("pending").$type<"pending" | "processing" | "success" | "failed">(),
    downloadStatus: text().default("pending").$type<"pending" | "processing" | "success" | "failed">(),
});

export const trackModelRelations = relations(trackModel, ({one}) => ({
    album: one(albumModel, {
        fields: [trackModel.albumId],
        references: [albumModel.randId]
    })
}));
