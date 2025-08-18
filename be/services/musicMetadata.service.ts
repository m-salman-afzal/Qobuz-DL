import { QobuzSearchResults } from "../../lib/qobuz-dl";
import { ArtistRepository, CreateArtistData } from "../infra/database/repositories/artist.repo";
import { GenreRepository, CreateGenreData } from "../infra/database/repositories/genre.repo";
import { LabelRepository, CreateLabelData } from "../infra/database/repositories/label.repo";
import { AlbumRepository, CreateAlbumData } from "../infra/database/repositories/album.repo";
import { TrackRepository, CreateTrackData } from "../infra/database/repositories/track.repository";

export class MusicService {
  /**
   * Processes QobuzSearchResults and stores all data in the database
   * Uses upsert logic to avoid duplicates based on Qobuz IDs
   */
  static async storeSearchResults(searchResults: QobuzSearchResults): Promise<{
    artists: number;
    genres: number;
    labels: number;
    albums: number;
    tracks: number;
  }> {
    const stats = {
      artists: 0,
      genres: 0,
      labels: 0,
      albums: 0,
      tracks: 0
    };

    try {
      // Process artists first (they are referenced by albums)
      for (const qobuzArtist of searchResults.artists.items) {
        await this.processArtist(qobuzArtist);
        stats.artists++;
      }

      // Process albums and their related data
      for (const qobuzAlbum of searchResults.albums.items) {
        // Process artist if not already processed
        const artist = await this.processArtist(qobuzAlbum.artist);
        
        // Process genre
        const genre = await this.processGenre(qobuzAlbum.genre);
        stats.genres++;
        
        // Process label
        const label = await this.processLabel(qobuzAlbum.label);
        stats.labels++;
        
        // Process album
        await this.processAlbum(qobuzAlbum, artist.randId, genre.randId, label.randId);
        stats.albums++;
      }

      // Process standalone tracks
      for (const qobuzTrack of searchResults.tracks.items) {
        // Process the track's album first (if not already processed)
        const artist = await this.processArtist(qobuzTrack.album.artist);
        const genre = await this.processGenre(qobuzTrack.album.genre);
        const label = await this.processLabel(qobuzTrack.album.label);
        
        const album = await this.processAlbum(qobuzTrack.album, artist.randId, genre.randId, label.randId);
        
        // Process the track
        await this.processTrack(qobuzTrack, album.randId);
        stats.tracks++;
      }

      return stats;
    } catch (error) {
      console.error('Error storing search results:', error);
      throw error;
    }
  }

  /**
   * Process and upsert artist data
   */
  private static async processArtist(qobuzArtist: any) {
    // Check if artist already exists
    let artist = await ArtistRepository.findByQobuzId(qobuzArtist.id);
    
    if (!artist) {
      const artistData: CreateArtistData = {
        name: qobuzArtist.name,
        id: qobuzArtist.id,
        albumsCount: qobuzArtist.albums_count || 0,
        image: qobuzArtist.image
      };
      
      artist = await ArtistRepository.create(artistData);
    } else {
      // Update existing artist with potentially new data
      artist = await ArtistRepository.updateByQobuzId(qobuzArtist.id, {
        name: qobuzArtist.name,
        albumsCount: qobuzArtist.albums_count || artist.albumsCount,
        image: qobuzArtist.image || artist.image
      });
    }
    
    return artist!;
  }

  /**
   * Process and upsert genre data
   */
  private static async processGenre(qobuzGenre: any) {
    // Check if genre already exists
    let genre = await GenreRepository.findByQobuzId(qobuzGenre.id);
    
    if (!genre) {
      const genreData: CreateGenreData = {
        path: qobuzGenre.path,
        color: qobuzGenre.color,
        name: qobuzGenre.name,
        id: qobuzGenre.id
      };
      
      genre = await GenreRepository.create(genreData);
    } else {
      // Update existing genre with potentially new data
      genre = await GenreRepository.updateByQobuzId(qobuzGenre.id, {
        path: qobuzGenre.path,
        color: qobuzGenre.color,
        name: qobuzGenre.name
      });
    }
    
    return genre!;
  }

  /**
   * Process and upsert label data
   */
  private static async processLabel(qobuzLabel: any) {
    // Check if label already exists
    let label = await LabelRepository.findByQobuzId(qobuzLabel.id);
    
    if (!label) {
      const labelData: CreateLabelData = {
        name: qobuzLabel.name,
        id: qobuzLabel.id,
        albumsCount: qobuzLabel.albums_count || 0
      };
      
      label = await LabelRepository.create(labelData);
    } else {
      // Update existing label with potentially new data
      label = await LabelRepository.updateByQobuzId(qobuzLabel.id, {
        name: qobuzLabel.name,
        albumsCount: qobuzLabel.albums_count || label.albumsCount
      });
    }
    
    return label!;
  }

  /**
   * Process and upsert album data
   */
  private static async processAlbum(qobuzAlbum: any, artistId: string, genreId: string, labelId: string) {
    // Check if album already exists
    let album = await AlbumRepository.findByQobuzId(qobuzAlbum.qobuz_id);
    
    if (!album) {
      const albumData: CreateAlbumData = {
        maximumBitDepth: qobuzAlbum.maximum_bit_depth,
        imageSmall: qobuzAlbum.image.small,
        imageThumbnail: qobuzAlbum.image.thumbnail,
        imageLarge: qobuzAlbum.image.large,
        imageBack: qobuzAlbum.image.back,
        artistId: artistId,
        artists: qobuzAlbum.artists,
        releasedAt: qobuzAlbum.released_at,
        labelId: labelId,
        title: qobuzAlbum.title,
        id: qobuzAlbum.qobuz_id,
        version: qobuzAlbum.version,
        duration: qobuzAlbum.duration,
        parentalWarning: qobuzAlbum.parental_warning ? 1 : 0,
        tracksCount: qobuzAlbum.tracks_count,
        genreId: genreId,
        qobuzStringId: qobuzAlbum.id,
        maximumSamplingRate: qobuzAlbum.maximum_sampling_rate,
        releaseDateOriginal: qobuzAlbum.release_date_original,
        hires: qobuzAlbum.hires ? 1 : 0,
        upc: qobuzAlbum.upc,
        streamable: qobuzAlbum.streamable ? 1 : 0
      };
      
      album = await AlbumRepository.create(albumData);
    } else {
      // Update existing album with potentially new data
      album = await AlbumRepository.updateByQobuzId(qobuzAlbum.qobuz_id, {
        maximumBitDepth: qobuzAlbum.maximum_bit_depth,
        imageSmall: qobuzAlbum.image.small,
        imageThumbnail: qobuzAlbum.image.thumbnail,
        imageLarge: qobuzAlbum.image.large,
        imageBack: qobuzAlbum.image.back,
        artists: qobuzAlbum.artists,
        releasedAt: qobuzAlbum.released_at,
        title: qobuzAlbum.title,
        version: qobuzAlbum.version,
        duration: qobuzAlbum.duration,
        parentalWarning: qobuzAlbum.parental_warning ? 1 : 0,
        tracksCount: qobuzAlbum.tracks_count,
        maximumSamplingRate: qobuzAlbum.maximum_sampling_rate,
        releaseDateOriginal: qobuzAlbum.release_date_original,
        hires: qobuzAlbum.hires ? 1 : 0,
        upc: qobuzAlbum.upc,
        streamable: qobuzAlbum.streamable ? 1 : 0
      });
    }
    
    return album!;
  }

  /**
   * Process and upsert track data
   */
  private static async processTrack(qobuzTrack: any, albumId: string) {
    // Check if track already exists
    let track = await TrackRepository.findByQobuzId(qobuzTrack.id);
    
    if (!track) {
      const trackData: CreateTrackData = {
        isrc: qobuzTrack.isrc,
        copyright: qobuzTrack.copyright,
        maximumBitDepth: qobuzTrack.maximum_bit_depth,
        maximumSamplingRate: qobuzTrack.maximum_sampling_rate,
        performer: qobuzTrack.performer,
        composer: qobuzTrack.composer || null,
        albumId: albumId,
        trackNumber: qobuzTrack.track_number,
        releasedAt: qobuzTrack.released_at,
        title: qobuzTrack.title,
        version: qobuzTrack.version,
        duration: qobuzTrack.duration,
        parentalWarning: qobuzTrack.parental_warning ? 1 : 0,
        id: qobuzTrack.id,
        hires: qobuzTrack.hires ? 1 : 0,
        streamable: qobuzTrack.streamable ? 1 : 0,
        mediaNumber: qobuzTrack.media_number
      };
      
      track = await TrackRepository.create(trackData);
    } else {
      // Update existing track with potentially new data
      track = await TrackRepository.updateByQobuzId(qobuzTrack.id, {
        isrc: qobuzTrack.isrc,
        copyright: qobuzTrack.copyright,
        maximumBitDepth: qobuzTrack.maximum_bit_depth,
        maximumSamplingRate: qobuzTrack.maximum_sampling_rate,
        performer: qobuzTrack.performer,
        composer: qobuzTrack.composer || null,
        trackNumber: qobuzTrack.track_number,
        releasedAt: qobuzTrack.released_at,
        title: qobuzTrack.title,
        version: qobuzTrack.version,
        duration: qobuzTrack.duration,
        parentalWarning: qobuzTrack.parental_warning ? 1 : 0,
        hires: qobuzTrack.hires ? 1 : 0,
        streamable: qobuzTrack.streamable ? 1 : 0,
        mediaNumber: qobuzTrack.media_number
      });
    }
    
    return track!;
  }
}
 