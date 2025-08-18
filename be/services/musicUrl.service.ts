import { getDownloadURL } from "@/lib/qobuz-dl";
import { TrackRepository } from "../infra/database/repositories/track.repository";
import z from "zod";

const downloadParamsSchema = z.object({
    track_id: z.preprocess(
        (a) => parseInt(a as string),
        z.number().min(0, "ID must be 0 or greater").default(1)
    ),
    quality: z.enum(["27", "7", "6", "5"]).default("27")
});

export type DownloadMusicParams = {
    track_id: number;
    quality: "27" | "7" | "6" | "5";
};

export type DownloadMusicResult = {
    success: boolean;
    data?: {
        url: string;
    };
    error?: string;
};

export class MusicUrlService {
    /**
     * Get download URL for a track and optionally store it in the database
     * @param params - Track ID and quality parameters
     * @param storeInDb - Whether to store the URL in the track table (default: true)
     * @returns Download URL and success status
     */
    static async getDownloadUrl(
        params: DownloadMusicParams, 
        storeInDb: boolean = true
    ): Promise<DownloadMusicResult> {
        try {
            // Validate input parameters
            const { track_id, quality } = downloadParamsSchema.parse(params);
            
            // Get download URL from Qobuz
            const url = await getDownloadURL(track_id, quality);
            
            if (!url) {
                return {
                    success: false,
                    error: "Failed to retrieve download URL from Qobuz"
                };
            }

            // Store URL in database if requested
            if (storeInDb) {
                try {
                    // Check if track exists in database
                    const existingTrack = await TrackRepository.findByQobuzId(track_id);
                    
                    if (existingTrack) {
                        // Update existing track with download URL
                        await TrackRepository.updateByQobuzId(track_id, {
                            downloadUrl: url
                        });
                    } else {
                        // If track doesn't exist, we could create a minimal record
                        // but for now we'll just proceed without storing
                        console.warn(`Track with Qobuz ID ${track_id} not found in database. URL not stored.`);
                    }
                } catch (dbError) {
                    // Log database error but don't fail the request
                    console.error("Error storing download URL in database:", dbError);
                }
            }

            return {
                success: true,
                data: { url }
            };

        } catch (error: any) {
            return {
                success: false,
                error: error?.errors || error.message || "An error occurred processing the download request."
            };
        }
    }


    static async findByDownloadStatusAndDownloadUrl() {
        const tracks = await TrackRepository.findByDownloadStatusAndDownloadUrl("pending");
        for (const track of tracks) {
             await this.getDownloadUrl({ track_id: track.id, quality: "27" });
        }

        return tracks;
    }
}
