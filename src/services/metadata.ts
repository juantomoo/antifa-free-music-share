import { Track, MusicSource, MetadataInfo } from '../types';
import { Logger } from '../utils/logger';
import { SpotifyDownloader } from '../downloaders/spotify';
import { DeezerDownloader } from '../downloaders/deezer';
import { TidalDownloader } from '../downloaders/tidal';
import { YouTubeDownloader } from '../downloaders/youtube';
import axios from 'axios';

// Legacy interface for compatibility
export interface Metadata {
    title: string;
    artist: string;
    coverArt: string;
}

export class MetadataService {
  private logger = Logger.getInstance();
  private spotifyDownloader: SpotifyDownloader;
  private deezerDownloader: DeezerDownloader;
  private tidalDownloader: TidalDownloader;

  constructor() {
    this.spotifyDownloader = new SpotifyDownloader();
    this.deezerDownloader = new DeezerDownloader();
    this.tidalDownloader = new TidalDownloader();
  }

  /**
   * Enhance track metadata by searching across multiple sources
   */
  async enhanceTrackMetadata(track: Track): Promise<Track> {
    this.logger.info(`Enhancing metadata for: ${track.artist} - ${track.title}`);

    const searchQuery = `${track.artist} ${track.title}`;
    const enhancedTrack = { ...track };

    // Try to get metadata from different sources
    const metadataTasks = [
      this.getSpotifyMetadata(searchQuery),
      this.getDeezerMetadata(searchQuery),
      this.getMusicBrainzMetadata(track.artist, track.title)
    ];

    try {
      const results = await Promise.allSettled(metadataTasks);
      
      // Merge results with priority: Spotify > Deezer > MusicBrainz
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          enhancedTrack.album = enhancedTrack.album || result.value.album;
          enhancedTrack.year = enhancedTrack.year || result.value.year;
          enhancedTrack.genre = enhancedTrack.genre || result.value.genre;
          enhancedTrack.trackNumber = enhancedTrack.trackNumber || result.value.trackNumber;
          enhancedTrack.thumbnailUrl = enhancedTrack.thumbnailUrl || result.value.thumbnailUrl;
          enhancedTrack.isrc = enhancedTrack.isrc || result.value.isrc;
          
          // Stop if we have enough metadata
          if (enhancedTrack.album && enhancedTrack.year && enhancedTrack.genre) {
            break;
          }
        }
      }
    } catch (error) {
      this.logger.error('Error enhancing metadata', error);
    }

    return enhancedTrack;
  }

  /**
   * Get metadata from Spotify
   */
  private async getSpotifyMetadata(searchQuery: string): Promise<Partial<Track> | null> {
    try {
      const results = await this.spotifyDownloader.searchTracks(searchQuery, 1);
      if (results.tracks.length > 0) {
        const track = results.tracks[0];
        return {
          album: track.album,
          year: track.year,
          genre: track.genre,
          trackNumber: track.trackNumber,
          thumbnailUrl: track.thumbnailUrl,
          isrc: track.isrc
        };
      }
    } catch (error) {
      this.logger.debug('Spotify metadata not available');
    }
    return null;
  }

  /**
   * Get metadata from Deezer
   */
  private async getDeezerMetadata(searchQuery: string): Promise<Partial<Track> | null> {
    try {
      const results = await this.deezerDownloader.searchTracks(searchQuery, 1);
      if (results.tracks.length > 0) {
        const track = results.tracks[0];
        return {
          album: track.album,
          year: track.year,
          trackNumber: track.trackNumber,
          thumbnailUrl: track.thumbnailUrl,
          isrc: track.isrc
        };
      }
    } catch (error) {
      this.logger.debug('Deezer metadata not available');
    }
    return null;
  }

  /**
   * Get metadata from MusicBrainz
   */
  private async getMusicBrainzMetadata(artist: string, title: string): Promise<Partial<Track> | null> {
    try {
      const searchQuery = `artist:"${artist}" AND recording:"${title}"`;
      const response = await axios.get('https://musicbrainz.org/ws/2/recording/', {
        params: {
          query: searchQuery,
          fmt: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'YTMusicDownloader/1.0.0'
        },
        timeout: 10000
      });

      if (response.data.recordings && response.data.recordings.length > 0) {
        const recording = response.data.recordings[0];
        const releaseInfo = recording.releases?.[0];
        
        return {
          album: releaseInfo?.title,
          year: releaseInfo?.date ? parseInt(releaseInfo.date.split('-')[0]) : undefined,
          isrc: recording.isrcs?.[0]
        };
      }
    } catch (error) {
      this.logger.debug('MusicBrainz metadata not available');
    }
    return null;
  }

  /**
   * Calculate track similarity
   */
  calculateTrackSimilarity(track1: Track, track2: Track): number {
    const titleSimilarity = this.stringSimilarity(
      track1.title.toLowerCase(),
      track2.title.toLowerCase()
    );
    
    const artistSimilarity = this.stringSimilarity(
      track1.artist.toLowerCase(),
      track2.artist.toLowerCase()
    );

    return (titleSimilarity * 0.7) + (artistSimilarity * 0.3);
  }

  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

// Legacy function for compatibility
export async function fetchMetadata(source: string, trackId: string): Promise<Metadata | null> {
    const metadataService = new MetadataService();
    let metadata: Metadata | null = null;

    switch (source) {
        case 'youtube':
            const youtubeDownloader = new YouTubeDownloader();
            const ytMetadata = await youtubeDownloader.fetchMetadata(trackId);
            if (ytMetadata) {
                metadata = {
                    title: ytMetadata.title,
                    artist: ytMetadata.artist,
                    coverArt: ytMetadata.coverArt
                };
            }
            break;
        case 'spotify':
            const spotifyDownloader = new SpotifyDownloader();
            const spMetadata = await spotifyDownloader.fetchMetadata(trackId);
            if (spMetadata) {
                metadata = {
                    title: spMetadata.title,
                    artist: spMetadata.artist,
                    coverArt: spMetadata.coverArt
                };
            }
            break;
        case 'deezer':
            // Implement deezer metadata fetch
            break;
        case 'tidal':
            const tidalDownloader = new TidalDownloader();
            const tidalMetadata = await tidalDownloader.fetchMetadata(trackId);
            metadata = {
                title: tidalMetadata.title,
                artist: tidalMetadata.artist,
                coverArt: tidalMetadata.coverArt
            };
            break;
        default:
            console.error('Unsupported source:', source);
            break;
    }

    return metadata;
}