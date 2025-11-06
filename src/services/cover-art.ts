import axios from 'axios';
import { Logger } from '../utils/logger';
import { MusicBrainzService } from './musicbrainz';

export interface CoverArtResult {
  url: string;
  source: string;
  width?: number;
  height?: number;
}

export class CoverArtService {
  private logger = Logger.getInstance();
  private musicBrainz: MusicBrainzService;

  constructor() {
    this.musicBrainz = new MusicBrainzService();
  }

  /**
   * Search for cover art from multiple sources
   */
  async searchCoverArt(artist: string, title: string, album?: string): Promise<CoverArtResult | null> {
    const sources = [
      () => this.searchMusicBrainz(artist, title, album),
      () => this.searchDeezer(artist, title, album),
      () => this.searchLastFM(artist, album),
      () => this.searchSpotify(artist, title, album),
      () => this.searchiTunes(artist, title, album)
    ];

    for (const searchFn of sources) {
      try {
        const result = await searchFn();
        if (result) {
          this.logger.info(`Found cover art from ${result.source}: ${result.url}`);
          return result;
        }
      } catch (error: any) {
        this.logger.debug(`Cover art search failed: ${error.message}`);
      }
    }

    return null;
  }

  /**
   * Search MusicBrainz/Cover Art Archive
   */
  private async searchMusicBrainz(artist: string, title: string, album?: string): Promise<CoverArtResult | null> {
    try {
      const recording = await this.musicBrainz.searchRecording(artist, title);
      if (recording && recording.coverArtUrl) {
        return {
          url: recording.coverArtUrl,
          source: 'MusicBrainz/Cover Art Archive'
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Search Deezer
   */
  private async searchDeezer(artist: string, title: string, album?: string): Promise<CoverArtResult | null> {
    try {
      const searchQuery = album ? `${artist} ${album}` : `${artist} ${title}`;
      const response = await axios.get('https://api.deezer.com/search', {
        params: {
          q: searchQuery,
          limit: 5
        },
        timeout: 10000
      });

      if (response.data.data && response.data.data.length > 0) {
        const track = response.data.data[0];
        if (track.album && track.album.cover_xl) {
          return {
            url: track.album.cover_xl,
            source: 'Deezer',
            width: 1000,
            height: 1000
          };
        } else if (track.album && track.album.cover_big) {
          return {
            url: track.album.cover_big,
            source: 'Deezer',
            width: 500,
            height: 500
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Search Last.fm
   */
  private async searchLastFM(artist: string, album?: string): Promise<CoverArtResult | null> {
    try {
      if (!album) return null;

      // Last.fm requires API key, but we can try the album art endpoint
      const response = await axios.get('https://ws.audioscrobbler.com/2.0/', {
        params: {
          method: 'album.getinfo',
          artist: artist,
          album: album,
          api_key: process.env.LASTFM_API_KEY || '43693fdfb81396f67d73bc5a5e8c2e0f', // Public demo key
          format: 'json'
        },
        timeout: 10000
      });

      if (response.data.album && response.data.album.image) {
        const images = response.data.album.image;
        const extraLarge = images.find((img: any) => img.size === 'extralarge');
        const large = images.find((img: any) => img.size === 'large');
        const coverUrl = extraLarge?.['#text'] || large?.['#text'];

        if (coverUrl && !coverUrl.includes('lastfm-placeholder')) {
          return {
            url: coverUrl,
            source: 'Last.fm'
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Search Spotify (requires token)
   */
  private async searchSpotify(artist: string, title: string, album?: string): Promise<CoverArtResult | null> {
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return null;
      }

      // Get access token
      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Search for track
      const searchQuery = album ? `${artist} ${title} ${album}` : `${artist} ${title}`;
      const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
        params: {
          q: searchQuery,
          type: 'track',
          limit: 5
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        timeout: 10000
      });

      if (searchResponse.data.tracks && searchResponse.data.tracks.items.length > 0) {
        const track = searchResponse.data.tracks.items[0];
        if (track.album && track.album.images && track.album.images.length > 0) {
          const image = track.album.images[0];
          return {
            url: image.url,
            source: 'Spotify',
            width: image.width,
            height: image.height
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Search iTunes
   */
  private async searchiTunes(artist: string, title: string, album?: string): Promise<CoverArtResult | null> {
    try {
      const searchTerm = album ? `${artist} ${album}` : `${artist} ${title}`;
      const response = await axios.get('https://itunes.apple.com/search', {
        params: {
          term: searchTerm,
          media: 'music',
          entity: 'song',
          limit: 5
        },
        timeout: 10000
      });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        if (result.artworkUrl100) {
          // iTunes provides multiple resolutions, get the highest
          const highResUrl = result.artworkUrl100
            .replace('100x100', '1200x1200')
            .replace('100x100bb', '1200x1200bb');

          return {
            url: highResUrl,
            source: 'iTunes',
            width: 1200,
            height: 1200
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Download cover art and return as buffer
   */
  async downloadCoverArt(url: string): Promise<Buffer | null> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        maxContentLength: 10 * 1024 * 1024 // 10MB max
      });

      return Buffer.from(response.data);
    } catch (error: any) {
      this.logger.warn(`Failed to download cover art: ${error.message}`);
      return null;
    }
  }
}
