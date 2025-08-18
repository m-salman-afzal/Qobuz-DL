import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { TrackRepository, TrackData } from '../infra/database/repositories/track.repository';




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
    private static async downloadTrack(track: TrackData): Promise<boolean> {
        try {
            console.log(`Starting download for track ID: ${track.id}`);
            
            // Update status to processing
            await TrackRepository.updateDownloadStatus(track.id, 'processing');
            console.log(`Updated track ${track.id} status to processing`);

            // Download the file
            if (!track.downloadUrl) {
                throw new Error(`No download URL found for track ${track.id}`);
            }

            const response = await axios.get(track.downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 300000, // 5 minute timeout
            });

            console.log(`Downloaded ${response.data.byteLength} bytes for track ${track.id}`);

            // Ensure downloads directory exists
            await this.ensureDownloadsDir();

            // Save file as {trackRandId}.flac
            const fileName = `${track.randId}.flac`;
            const filePath = path.join(this.downloadsDir, fileName);
            
            await fs.writeFile(filePath, Buffer.from(response.data));
            console.log(`Saved track ${track.id} to ${filePath}`);

            // Update status to downloaded/success
            await TrackRepository.updateDownloadStatus(track.id, 'success');
            console.log(`Updated track ${track.id} status to success`);

            return true;

        } catch (error) {
            console.error(`Error downloading track ${track.id}:`, error);
            
            // Update status to failed
            try {
                await TrackRepository.updateDownloadStatus(track.id, 'failed');
                console.log(`Updated track ${track.id} status to failed`);
            } catch (updateError) {
                console.error(`Failed to update track ${track.id} status to failed:`, updateError);
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
                console.log(`Processing track ${processed}/${pendingTracks.length}: ID ${track.id}`);

                try {
                    const success = await this.downloadTrack(track);
                    if (success) {
                        successful++;
                        console.log(`Successfully downloaded track ${track.id}`);
                    } else {
                        failed++;
                        const errorMsg = `Failed to download track ${track.id}`;
                        console.error(errorMsg);
                        errors.push(errorMsg);
                    }
                } catch (error) {
                    failed++;
                    const errorMsg = `Error processing track ${track.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
     * Download a specific track by its Qobuz ID
     */
    static async downloadTrackById(qobuzId: number): Promise<boolean> {
        try {
            console.log(`Looking for track with Qobuz ID: ${qobuzId}`);
            
            const track = await TrackRepository.findByQobuzId(qobuzId);
            if (!track) {
                console.error(`Track with Qobuz ID ${qobuzId} not found in database`);
                return false;
            }

            return await this.downloadTrack(track);
        } catch (error) {
            console.error(`Error downloading track by ID ${qobuzId}:`, error);
            return false;
        }
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
