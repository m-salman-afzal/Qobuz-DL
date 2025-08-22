import { eq, and, isNull, not } from "drizzle-orm";
import { db } from "../connection";
import { trackModel } from "../models/track.model";
import { albumModel, artistModel, genreModel } from "../models";
import { AlbumData } from "./album.repo";
import { ArtistData } from "./artist.repo";
import { GenreData } from "./genre.repo";

export type CreateTrackData = typeof trackModel.$inferInsert;
export type TrackData = typeof trackModel.$inferSelect;
export type UpdateTrackData = Partial<Omit<CreateTrackData, 'sId' | 'randId' | 'createdAt'>>;

export type TrackWithAlbumAndArtistAndGenre = {
  tracks: TrackData | null;
  albums: AlbumData | null;
  artists: ArtistData | null;
  genres: GenreData | null;
};

export class TrackRepository {
  // Create a new track
  static async create(data: CreateTrackData): Promise<TrackData> {
    const [track] = await db.insert(trackModel).values(data).returning();
    return track;
  }

  // Find track by sequential ID
  static async findById(sId: number): Promise<TrackData | null> {
    const [track] = await db.select().from(trackModel).where(eq(trackModel.sId, sId));
    return track || null;
  }

  // Find track by random UUID
  static async findByRandId(randId: string): Promise<TrackData | null> {
    const [track] = await db.select().from(trackModel).where(eq(trackModel.randId, randId));
    return track || null;
  }

  // Find track by Qobuz ID
  static async findByQobuzId(id: number): Promise<TrackData | null> {
    const [track] = await db.select().from(trackModel).where(eq(trackModel.id, id));
    return track || null;
  }

  // Find track by ISRC
  static async findByIsrc(isrc: string): Promise<TrackData | null> {
    const [track] = await db.select().from(trackModel).where(eq(trackModel.isrc, isrc));
    return track || null;
  }

  // Get all tracks with pagination
  static async findAll(limit: number = 10, offset: number = 0): Promise<TrackData[]> {
    return await db.select().from(trackModel).limit(limit).offset(offset);
  }

  // Find tracks by album ID
  static async findByAlbumId(albumId: string): Promise<TrackData[]> {
    return await db.select().from(trackModel).where(eq(trackModel.albumId, albumId));
  }

  // Find tracks by title (exact match)
  static async findByTitle(title: string): Promise<TrackData[]> {
    return await db.select().from(trackModel).where(eq(trackModel.title, title));
  }

  // Find tracks by track number and album ID
  static async findByTrackNumberAndAlbum(trackNumber: number, albumId: string): Promise<TrackData | null> {
    const [track] = await db.select().from(trackModel)
      .where(and(eq(trackModel.trackNumber, trackNumber), eq(trackModel.albumId, albumId)));
    return track || null;
  }

  // Find tracks by media number and album ID
  static async findByMediaNumberAndAlbum(mediaNumber: number, albumId: string): Promise<TrackData[]> {
    return await db.select().from(trackModel)
      .where(and(eq(trackModel.mediaNumber, mediaNumber), eq(trackModel.albumId, albumId)));
  }

  // Search tracks by performer name (exact match)
  static async findByPerformerName(): Promise<TrackData[]> {
    // Note: This is a simplified search. For JSON field searches, you'd need to use JSON operators
    return await db.select().from(trackModel); // Would need JSON path query for performer.name
  }

  // Search tracks by composer name (exact match)
  static async findByComposerName(): Promise<TrackData[]> {
    // Note: This is a simplified search. For JSON field searches, you'd need to use JSON operators
    return await db.select().from(trackModel); // Would need JSON path query for composer.name
  }

  // Update track by sequential ID
  static async updateById(sId: number, data: UpdateTrackData): Promise<TrackData | null> {
    const [track] = await db.update(trackModel)
      .set(data)
      .where(eq(trackModel.sId, sId))
      .returning();
    return track || null;
  }

  // Update track by random UUID
  static async updateByRandId(randId: string, data: UpdateTrackData): Promise<TrackData | null> {
    const [track] = await db.update(trackModel)
      .set(data)
      .where(eq(trackModel.randId, randId))
      .returning();
    return track || null;
  }

  // Update track by Qobuz ID
  static async updateByQobuzId(id: number, data: UpdateTrackData): Promise<TrackData | null> {
    const [track] = await db.update(trackModel)
      .set(data)
      .where(eq(trackModel.id, id))
      .returning();
    return track || null;
  }

  // Delete track by sequential ID
  static async deleteById(sId: number): Promise<boolean> {
    try {
      await db.delete(trackModel).where(eq(trackModel.sId, sId));
      return true;
    } catch {
      return false;
    }
  }

  // Delete track by random UUID
  static async deleteByRandId(randId: string): Promise<boolean> {
    try {
      await db.delete(trackModel).where(eq(trackModel.randId, randId));
      return true;
    } catch {
      return false;
    }
  }

  // Delete track by Qobuz ID
  static async deleteByQobuzId(id: number): Promise<boolean> {
    try {
      await db.delete(trackModel).where(eq(trackModel.id, id));
      return true;
    } catch {
      return false;
    }
  }

  // Delete all tracks by album ID
  static async deleteByAlbumId(albumId: string): Promise<number> {
    // Count before deletion
    const countBefore = await this.countByAlbumId(albumId);
    await db.delete(trackModel).where(eq(trackModel.albumId, albumId));
    return countBefore;
  }

  // Check if track exists by Qobuz ID
  static async existsByQobuzId(id: number): Promise<boolean> {
    const [track] = await db.select({ sId: trackModel.sId }).from(trackModel).where(eq(trackModel.id, id));
    return !!track;
  }

  // Check if track exists by ISRC
  static async existsByIsrc(isrc: string): Promise<boolean> {
    const [track] = await db.select({ sId: trackModel.sId }).from(trackModel).where(eq(trackModel.isrc, isrc));
    return !!track;
  }

  // Count total tracks
  static async count(): Promise<number> {
    const [result] = await db.select({ count: trackModel.sId }).from(trackModel);
    return result?.count || 0;
  }

  // Count tracks by album ID
  static async countByAlbumId(albumId: string): Promise<number> {
    const [result] = await db.select({ count: trackModel.sId })
      .from(trackModel)
      .where(eq(trackModel.albumId, albumId));
    return result?.count || 0;
  }

  // Get tracks with high-res audio (hires = 1)
  static async findHiResTracks(limit: number = 10, offset: number = 0): Promise<TrackData[]> {
    return await db.select().from(trackModel)
      .where(eq(trackModel.hires, 1))
      .limit(limit)
      .offset(offset);
  }

  // Get streamable tracks (streamable = 1)
  static async findStreamableTracks(limit: number = 10, offset: number = 0): Promise<TrackData[]> {
    return await db.select().from(trackModel)
      .where(eq(trackModel.streamable, 1))
      .limit(limit)
      .offset(offset);
  }

  // Get tracks with parental warning (parentalWarning = 1)
  static async findTracksWithParentalWarning(limit: number = 10, offset: number = 0): Promise<TrackData[]> {
    return await db.select().from(trackModel)
      .where(eq(trackModel.parentalWarning, 1))
      .limit(limit)
      .offset(offset);
  }

  // Get tracks ordered by track number within an album
  static async findByAlbumIdOrderedByTrackNumber(albumId: string): Promise<TrackData[]> {
    return await db.select().from(trackModel)
      .where(eq(trackModel.albumId, albumId))
      .orderBy(trackModel.trackNumber);
  }

  // Get tracks ordered by media number and track number within an album
  static async findByAlbumIdOrderedByMediaAndTrack(albumId: string): Promise<TrackData[]> {
    return await db.select().from(trackModel)
      .where(eq(trackModel.albumId, albumId))
      .orderBy(trackModel.mediaNumber, trackModel.trackNumber);
  }

  static async findByDownloadStatusAndDownloadUrl(
    status: 'pending' | 'success' | 'failed'
  ): Promise<TrackData[]> {
    return await db.select().from(trackModel)
      .where(and(eq(trackModel.downloadStatus, status), isNull(trackModel.downloadUrl)));
  }

  // Find tracks with pending download status
  static async findPendingDownloads() {
    return await db.select().from(trackModel).leftJoin(albumModel, eq(trackModel.albumId, albumModel.randId)).leftJoin(artistModel, eq(albumModel.artistId, artistModel.randId)).leftJoin(genreModel, eq(albumModel.genreId, genreModel.randId))
      .where(and(eq(trackModel.downloadStatus, 'pending'), not(isNull(trackModel.downloadUrl))));
  }

  // Update download status by track ID
  static async updateDownloadStatus(id: number, status: 'pending' | 'processing' | 'success' | 'failed'): Promise<TrackData | null> {
    const [track] = await db.update(trackModel)
      .set({ downloadStatus: status })
      .where(eq(trackModel.id, id))
      .returning();
    return track || null;
  }
}
