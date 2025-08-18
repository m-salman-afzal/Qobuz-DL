import {relations} from "drizzle-orm";
import { integer, json, pgEnum, pgTable, uuid, varchar} from "drizzle-orm/pg-core";

import {albumModel} from "./album.model";
import {baseModel} from "./base.model";

export const uploadStatusEnum = pgEnum("uploadStatus", ["pending", "processing", "success", "failed"]);
export const downloadStatusEnum = pgEnum("downloadStatus", ["pending", "processing", "success", "failed"]);
export const trackModel = pgTable("tracks", {
    ...baseModel("track"),
    isrc: varchar(),
    copyright: varchar(),
    maximumBitDepth: integer(),
    maximumSamplingRate: varchar(),
    performer: json()
        .$type<{
            name: string;
            id: number;
        }>()
        ,
    composer: json().$type<{
        name: string;
        id: number;
    } | null>(),
    albumId: uuid()
        .references(() => albumModel.randId),
    trackNumber: integer(),
    releasedAt: integer(),
    title: varchar(),
    version: varchar(),
    duration: integer(),
    parentalWarning: integer(), // 0 = false, 1 = true
    id: integer().notNull().unique(),
    hires: integer(), // 0 = false, 1 = true
    streamable: integer(), // 0 = false, 1 = true
    mediaNumber: integer(),
    downloadUrl: varchar(),
    uploadStatus: uploadStatusEnum().default("pending"),
    downloadStatus: downloadStatusEnum().default("pending"),
});

export const trackModelRelations = relations(trackModel, ({one}) => ({
    album: one(albumModel, {
        fields: [trackModel.albumId],
        references: [albumModel.randId]
    })
}));
