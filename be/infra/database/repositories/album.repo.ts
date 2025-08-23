import {eq, sql} from "drizzle-orm";
import {db} from "../connection";
import {albumModel} from "../models/album.model";

export type CreateAlbumData = typeof albumModel.$inferInsert;
export type AlbumData = typeof albumModel.$inferSelect;
export type UpdateAlbumData = Partial<Omit<CreateAlbumData, "sId" | "rId" | "createdAt">>;

export class AlbumRepository {
    static async create(data: CreateAlbumData): Promise<AlbumData> {
        const [album] = await db.insert(albumModel).values(data).returning();
        return album;
    }

    static async findById(sId: number): Promise<AlbumData | null> {
        const [album] = await db.select().from(albumModel).where(eq(albumModel.sId, sId));
        return album || null;
    }

    static async findByrId(rId: string): Promise<AlbumData | null> {
        const [album] = await db.select().from(albumModel).where(eq(albumModel.rId, rId));
        return album || null;
    }

    static async findByQobuzId(id: number): Promise<AlbumData | null> {
        const [album] = await db
            .select()
            .from(albumModel)
            .where(sql`data->>'qobuz_id' = ${id}`);
        return album || null;
    }

    static async updateById(sId: number, data: UpdateAlbumData): Promise<AlbumData | null> {
        const [album] = await db.update(albumModel).set(data).where(eq(albumModel.sId, sId)).returning();
        return album || null;
    }

    static async updateByrId(rId: string, data: UpdateAlbumData): Promise<AlbumData | null> {
        const [album] = await db.update(albumModel).set(data).where(eq(albumModel.rId, rId)).returning();
        return album || null;
    }

    static async updateByQobuzId(id: number, data: UpdateAlbumData): Promise<AlbumData | null> {
        const [album] = await db
            .update(albumModel)
            .set(data)
            .where(sql`data->>'qobuz_id' = ${id}`)
            .returning();
        return album || null;
    }

    static async existsByQobuzId(id: number): Promise<boolean> {
        const [album] = await db
            .select({sId: albumModel.sId})
            .from(albumModel)
            .where(sql`data->>'qobuz_id' = ${id}`);
        return !!album;
    }
}
