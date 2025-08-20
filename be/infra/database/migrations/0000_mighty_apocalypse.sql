CREATE TABLE `albums` (
	`sId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`randId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`maximumBitDepth` integer,
	`imageSmall` text,
	`imageThumbnail` text,
	`imageLarge` text,
	`imageBack` text,
	`artistId` text,
	`artists` text,
	`releasedAt` integer,
	`labelId` text,
	`title` text,
	`id` integer NOT NULL,
	`version` text,
	`duration` integer,
	`parentalWarning` integer,
	`tracksCount` integer,
	`genreId` text,
	`qobuzStringId` text,
	`maximumSamplingRate` text,
	`releaseDateOriginal` text,
	`hires` integer,
	`upc` text,
	`streamable` integer,
	FOREIGN KEY (`artistId`) REFERENCES `artists`(`randId`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`labelId`) REFERENCES `labels`(`randId`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`genreId`) REFERENCES `genres`(`randId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `album_randId_unique` ON `albums` (`randId`);--> statement-breakpoint
CREATE UNIQUE INDEX `albums_id_unique` ON `albums` (`id`);--> statement-breakpoint
CREATE TABLE `artists` (
	`sId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`randId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`name` text,
	`id` integer,
	`albumsCount` integer,
	`image` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artist_randId_unique` ON `artists` (`randId`);--> statement-breakpoint
CREATE UNIQUE INDEX `artists_id_unique` ON `artists` (`id`);--> statement-breakpoint
CREATE TABLE `genres` (
	`sId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`randId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`path` text,
	`color` text,
	`name` text,
	`id` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `genre_randId_unique` ON `genres` (`randId`);--> statement-breakpoint
CREATE UNIQUE INDEX `genres_id_unique` ON `genres` (`id`);--> statement-breakpoint
CREATE TABLE `labels` (
	`sId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`randId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`name` text,
	`id` integer NOT NULL,
	`albumsCount` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `label_randId_unique` ON `labels` (`randId`);--> statement-breakpoint
CREATE UNIQUE INDEX `labels_id_unique` ON `labels` (`id`);--> statement-breakpoint
CREATE TABLE `tracks` (
	`sId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`randId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`isrc` text,
	`copyright` text,
	`maximumBitDepth` integer,
	`maximumSamplingRate` text,
	`performer` text,
	`composer` text,
	`albumId` text,
	`trackNumber` integer,
	`releasedAt` integer,
	`title` text,
	`version` text,
	`duration` integer,
	`parentalWarning` integer,
	`id` integer NOT NULL,
	`hires` integer,
	`streamable` integer,
	`mediaNumber` integer,
	`downloadUrl` text,
	`uploadStatus` text DEFAULT 'pending',
	`downloadStatus` text DEFAULT 'pending',
	FOREIGN KEY (`albumId`) REFERENCES `albums`(`randId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `track_randId_unique` ON `tracks` (`randId`);--> statement-breakpoint
CREATE UNIQUE INDEX `tracks_id_unique` ON `tracks` (`id`);