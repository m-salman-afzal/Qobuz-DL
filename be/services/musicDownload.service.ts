import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { TrackRepository,  TrackWithAlbumAndArtistAndGenre } from '../infra/database/repositories/track.repository';
import { MusicUrlService } from './musicUrl.service';

export class MusicDownloadService {
    private static downloadsDir = path.join(process.cwd(), 'downloads');

    /**
     * Ensure downloads directory exists
     */
    private static async ensureDownloadsDir(): Promise<void> {
        try {
            await fs.access(this.downloadsDir);
        } catch {
            await fs.mkdir(this.downloadsDir, { recursive: true });
        }
    }

    /**
     * Download and save a single track
     */
    private static async downloadTrack(track: TrackWithAlbumAndArtistAndGenre): Promise<boolean> {
        if (!track.tracks) {
            throw new Error('Track not found');
        }

        // This helper function removes characters that are invalid in file or folder names (such as < > : " / \ | ? * and control characters)
        // and also collapses multiple spaces into a single space, then trims leading/trailing whitespace.
        function sanitizeName(name: string): string {
            return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, ' ').trim();
        }

        try {
            console.log(`Starting download for track ID: ${track.tracks.id}`);
            
            // Update status to processing
            await TrackRepository.updateDownloadStatus(track.tracks?.id || 0, 'processing');
            console.log(`Updated track ${track.tracks?.id} status to processing`);

            // Download the file
            if (!track.tracks.downloadUrl) {
                throw new Error(`No download URL found for track ${track.tracks.id}`);
            }

            // Try to download the file, and if we get a 410 (Gone), refresh the downloadUrl and try again
            let response;
            try {
                response = await axios.get(track.tracks.downloadUrl, {
                    responseType: 'arraybuffer',
                    timeout: 300000, // 5 minute timeout
                });
            } catch (error: any) {
                if (error.response && error.response.status === 410) {
                    // Download URL expired, refresh it and try again
                    console.warn(`Download URL expired for track ${track.tracks.id}, refreshing URL...`);
                    // Dynamically import MusicUrlService to avoid circular dependency
                    const urlResult = await MusicUrlService.getDownloadUrl({ track_id: track.tracks.id, quality: "27" });
                    if (urlResult.success && urlResult.data?.url) {
                        // Update the track's downloadUrl in memory for this attempt
                        track.tracks.downloadUrl = urlResult.data.url;
                        // Try downloading again with the new URL
                        response = await axios.get(track.tracks.downloadUrl, {
                            responseType: 'arraybuffer',
                            timeout: 300000,
                        });
                    } else {
                        throw new Error(`Failed to refresh download URL for track ${track.tracks.id}: ${urlResult.error}`);
                    }
                } else {
                    throw error;
                }
            }

            console.log(`Downloaded ${response.data.byteLength} bytes for track ${track.tracks.id}`);

            // Ensure downloads directory exists
            await this.ensureDownloadsDir();

            // Prepare folder and file names
            const albumTitle = track.albums?.title ? sanitizeName(track.albums.title) : 'Unknown Album';
            const artistName = track.artists?.name ? sanitizeName(track.artists.name) : 'Unknown Artist';
            const genreName = track.genres?.name ? sanitizeName(track.genres.name) : 'Unknown Genre';
            const trackTitle = track.tracks.title ? sanitizeName(track.tracks.title) : `Track_${track.tracks.id}`;

            // Folder: "album title --- artist name --- genre"
            const folderName = `${albumTitle} --- ${artistName} --- ${genreName}`;
            const folderPath = path.join(this.downloadsDir, folderName);

            // Ensure the album/artist/genre folder exists
            try {
                await fs.access(folderPath);
            } catch {
                await fs.mkdir(folderPath, { recursive: true });
            }

            // File: "track title.flac"
            const fileName = `${trackTitle}.flac`;
            const filePath = path.join(folderPath, fileName);

            await fs.writeFile(filePath, Buffer.from(response.data));
            console.log(`Saved track ${track.tracks.id} to ${filePath}`);

            // Update status to downloaded/success
            await TrackRepository.updateDownloadStatus(track.tracks.id, 'success');
            console.log(`Updated track ${track.tracks.id} status to success`);

            return true;

        } catch (error) {
            console.error(`Error downloading track ${track.tracks.id}:`, error);
            
            // Update status to failed
            try {
                await TrackRepository.updateDownloadStatus(track.tracks.id, 'failed');
                console.log(`Updated track ${track.tracks.id} status to failed`);
            } catch (updateError) {
                console.error(`Failed to update track ${track.tracks.id} status to failed:`, updateError);
            }
            
            return false;
        }
    }

    /**
     * Process all pending downloads
     */
    static async processPendingDownloads(): Promise<{
        processed: number;
        successful: number;
        failed: number;
        errors: string[];
    }> {
        console.log('Starting to process pending downloads...');
        
        const errors: string[] = [];
        let processed = 0;
        let successful = 0;
        let failed = 0;

        try {
            // Get all tracks with pending download status
            const pendingTracks = await TrackRepository.findPendingDownloads();
            console.log(`Found ${pendingTracks.length} pending tracks`);

            if (pendingTracks.length === 0) {
                return { processed: 0, successful: 0, failed: 0, errors: [] };
            }

            // Process each track
            for (const track of pendingTracks) {
                processed++;
                console.log(`Processing track ${processed}/${pendingTracks.length}: ID ${track.tracks.id}`);

                try {
                    const success = await this.downloadTrack(track);
                    if (success) {
                        successful++;
                        console.log(`Successfully downloaded track ${track.tracks.id}`);
                    } else {
                        failed++;
                        const errorMsg = `Failed to download track ${track.tracks.id}`;
                        console.error(errorMsg);
                        errors.push(errorMsg);
                    }
                } catch (error) {
                    failed++;
                    const errorMsg = `Error processing track ${track.tracks.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    console.error(errorMsg);
                    errors.push(errorMsg);
                }

                // Add a small delay between downloads to be respectful to the API
                if (processed < pendingTracks.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

        } catch (error) {
            const errorMsg = `Error fetching pending tracks: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(errorMsg);
            errors.push(errorMsg);
        }

        console.log(`Download processing complete. Processed: ${processed}, Successful: ${successful}, Failed: ${failed}`);
        
        return {
            processed,
            successful,
            failed,
            errors
        };
    }


    /**
     * Get download statistics
     */
    static async getDownloadStats(): Promise<{
        pending: number;
        processing: number;
        successful: number;
        failed: number;
    }> {
        try {
            // This would require additional repository methods, but for now we'll use basic queries
            const allTracks = await TrackRepository.findAll(1000, 0); // Get a large batch to count
            
            const stats = {
                pending: 0,
                processing: 0,
                successful: 0,
                failed: 0
            };

            for (const track of allTracks) {
                switch (track.downloadStatus) {
                    case 'pending':
                        stats.pending++;
                        break;
                    case 'processing':
                        stats.processing++;
                        break;
                    case 'success':
                        stats.successful++;
                        break;
                    case 'failed':
                        stats.failed++;
                        break;
                }
            }

            return stats;
        } catch (error) {
            console.error('Error getting download stats:', error);
            return { pending: 0, processing: 0, successful: 0, failed: 0 };
        }
    }
}
