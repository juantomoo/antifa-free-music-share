import axios from 'axios';
import { Logger } from '../utils/logger';

export interface MusicBrainzTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  duration?: number;
  coverArtUrl?: string;
  releaseId?: string;
  trackNumber?: number;
  totalTracks?: number;
  genres?: string[];
  isrc?: string;
}

export class MusicBrainzService {
  private logger = Logger.getInstance();
  private baseUrl = 'https://musicbrainz.org/ws/2';
  private coverArtUrl = 'https://coverartarchive.org';
  private userAgent: string;
  private rateLimitMs = 1000; // 1 request per second (MusicBrainz requirement)
  private lastRequest = 0;

  constructor() {
    const appName = process.env.MUSICBRAINZ_APP_NAME || 'youtube-music-downloader';
    const appVersion = process.env.MUSICBRAINZ_APP_VERSION || '1.0.0';
    const contact = process.env.MUSICBRAINZ_CONTACT || 'user@example.com';
    this.userAgent = `${appName}/${appVersion} ( ${contact} )`;
  }

  /**
   * Rate limit requests to respect MusicBrainz guidelines
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < this.rateLimitMs) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitMs - timeSinceLastRequest));
    }
    this.lastRequest = Date.now();
  }

  /**
   * Search for a recording by artist and title
   */
  async searchRecording(artist: string, title: string): Promise<MusicBrainzTrack | null> {
    try {
      await this.waitForRateLimit();

      const query = `recording:"${title}" AND artist:"${artist}"`;
      const response = await axios.get(`${this.baseUrl}/recording/`, {
        params: {
          query,
          fmt: 'json',
          limit: 5
        },
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000
      });

      if (response.data.recordings && response.data.recordings.length > 0) {
        const recording = response.data.recordings[0];
        
        // Get release information
        let releaseId: string | undefined;
        let album: string | undefined;
        let year: number | undefined;
        let trackNumber: number | undefined;
        let totalTracks: number | undefined;

        if (recording.releases && recording.releases.length > 0) {
          const release = recording.releases[0];
          releaseId = release.id;
          album = release.title;
          
          if (release.date) {
            year = parseInt(release.date.substring(0, 4));
          }

          // Get track position if available
          if (release['track-count']) {
            totalTracks = release['track-count'];
          }
        }

        // Get artist name
        const artistName = recording['artist-credit'] && recording['artist-credit'].length > 0
          ? recording['artist-credit'][0].name
          : artist;

        // Get genres/tags
        const genres: string[] = [];
        if (recording.tags && recording.tags.length > 0) {
          genres.push(...recording.tags.map((tag: any) => tag.name));
        }

        const track: MusicBrainzTrack = {
          id: recording.id,
          title: recording.title,
          artist: artistName,
          album,
          year,
          duration: recording.length ? Math.round(recording.length / 1000) : undefined,
          releaseId,
          trackNumber,
          totalTracks,
          genres: genres.length > 0 ? genres : undefined,
          isrc: recording.isrcs && recording.isrcs.length > 0 ? recording.isrcs[0] : undefined
        };

        // Try to get cover art
        if (releaseId) {
          const coverArtUrl = await this.getCoverArt(releaseId);
          if (coverArtUrl) {
            track.coverArtUrl = coverArtUrl;
          }
        }

        return track;
      }

      return null;
    } catch (error: any) {
      if (error.response?.status === 503) {
        this.logger.warn('MusicBrainz rate limit exceeded, waiting...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return null;
      }
      this.logger.debug(`MusicBrainz search failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Get cover art for a release
   */
  async getCoverArt(releaseId: string): Promise<string | null> {
    try {
      await this.waitForRateLimit();

      const response = await axios.get(`${this.coverArtUrl}/release/${releaseId}`, {
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000
      });

      if (response.data.images && response.data.images.length > 0) {
        // Get the front cover or first image
        const frontCover = response.data.images.find((img: any) => 
          img.front === true || img.types.includes('Front')
        );
        
        const image = frontCover || response.data.images[0];
        
        // Return the highest quality image
        return image.image || image.thumbnails?.large || image.thumbnails?.small || null;
      }

      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        this.logger.debug(`No cover art found for release ${releaseId}`);
      } else {
        this.logger.debug(`Cover art fetch failed: ${error.message}`);
      }
      return null;
    }
  }

  /**
   * Get detailed release information
   */
  async getRelease(releaseId: string): Promise<any> {
    try {
      await this.waitForRateLimit();

      const response = await axios.get(`${this.baseUrl}/release/${releaseId}`, {
        params: {
          fmt: 'json',
          inc: 'artists+recordings+release-groups+genres'
        },
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000
      });

      return response.data;
    } catch (error: any) {
      this.logger.debug(`Release fetch failed: ${error.message}`);
      return null;
    }
  }
}
