import { eq } from "drizzle-orm";
import { db } from "../connection";
import { albumModel } from "../models/album.model";

export type CreateAlbumData = typeof albumModel.$inferInsert;
export type AlbumData = typeof albumModel.$inferSelect;
export type UpdateAlbumData = Partial<Omit<CreateAlbumData, 'sId' | 'randId' | 'createdAt'>>;

export class AlbumRepository {
  // Create a new album
  static async create(data: CreateAlbumData): Promise<AlbumData> {
    const [album] = await db.insert(albumModel).values(data).returning();
    return album;
  }

  // Find album by sequential ID
  static async findById(sId: number): Promise<AlbumData | null> {
    const [album] = await db.select().from(albumModel).where(eq(albumModel.sId, sId));
    return album || null;
  }

  // Find album by random UUID
  static async findByRandId(randId: string): Promise<AlbumData | null> {
    const [album] = await db.select().from(albumModel).where(eq(albumModel.randId, randId));
    return album || null;
  }

  // Find album by Qobuz ID
  static async findByQobuzId(id: number): Promise<AlbumData | null> {
    const [album] = await db.select().from(albumModel).where(eq(albumModel.id, id));
    return album || null;
  }

  // Find album by Qobuz string ID
  static async findByQobuzStringId(qobuzStringId: string): Promise<AlbumData | null> {
    const [album] = await db.select().from(albumModel).where(eq(albumModel.qobuzStringId, qobuzStringId));
    return album || null;
  }

  // Get all albums with pagination
  static async findAll(limit: number = 10, offset: number = 0): Promise<AlbumData[]> {
    return await db.select().from(albumModel).limit(limit).offset(offset);
  }

  // Find albums by artist ID
  static async findByArtistId(artistId: string): Promise<AlbumData[]> {
    return await db.select().from(albumModel).where(eq(albumModel.artistId, artistId));
  }

  // Find albums by label ID
  static async findByLabelId(labelId: string): Promise<AlbumData[]> {
    return await db.select().from(albumModel).where(eq(albumModel.labelId, labelId));
  }

  // Find albums by genre ID
  static async findByGenreId(genreId: string): Promise<AlbumData[]> {
    return await db.select().from(albumModel).where(eq(albumModel.genreId, genreId));
  }

  // Update album by sequential ID
  static async updateById(sId: number, data: UpdateAlbumData): Promise<AlbumData | null> {
    const [album] = await db.update(albumModel)
      .set(data)
      .where(eq(albumModel.sId, sId))
      .returning();
    return album || null;
  }

  // Update album by random UUID
  static async updateByRandId(randId: string, data: UpdateAlbumData): Promise<AlbumData | null> {
    const [album] = await db.update(albumModel)
      .set(data)
      .where(eq(albumModel.randId, randId))
      .returning();
    return album || null;
  }

  // Update album by Qobuz ID
  static async updateByQobuzId(id: number, data: UpdateAlbumData): Promise<AlbumData | null> {
    const [album] = await db.update(albumModel)
      .set(data)
      .where(eq(albumModel.id, id))
      .returning();
    return album || null;
  }

  // Delete album by sequential ID
  static async deleteById(sId: number): Promise<boolean> {
    try {
      await db.delete(albumModel).where(eq(albumModel.sId, sId));
      return true;
    } catch {
      return false;
    }
  }

  // Delete album by random UUID
  static async deleteByRandId(randId: string): Promise<boolean> {
    try {
      await db.delete(albumModel).where(eq(albumModel.randId, randId));
      return true;
    } catch {
      return false;
    }
  }

  // Check if album exists by Qobuz ID
  static async existsByQobuzId(id: number): Promise<boolean> {
    const [album] = await db.select({ sId: albumModel.sId }).from(albumModel).where(eq(albumModel.id, id));
    return !!album;
  }

  // Count total albums
  static async count(): Promise<number> {
    const [result] = await db.select({ count: albumModel.sId }).from(albumModel);
    return result?.count || 0;
  }
}
