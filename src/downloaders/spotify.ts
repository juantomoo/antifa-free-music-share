import SpotifyWebApi from 'spotify-web-api-node';
import puppeteer from 'puppeteer';
import { Track, Playlist, MusicSource, SearchResult, DownloadResult } from '../types';
import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config';
import { YouTubeDownloader } from './youtube';
import axios from 'axios';

export class SpotifyDownloader {
  private logger = Logger.getInstance();
  private config = ConfigManager.getInstance();
  private spotifyApi: SpotifyWebApi;
  private youtubeDownloader: YouTubeDownloader;
  private accessToken?: string;
  private apiUrl: string = 'https://api.spotify.com/v1';

  constructor(accessToken?: string) {
    const credentials = this.config.getApiCredentials().spotify;
    
    this.spotifyApi = new SpotifyWebApi({
      clientId: credentials?.clientId,
      clientSecret: credentials?.clientSecret
    });

    if (accessToken) {
      this.accessToken = accessToken;
      this.spotifyApi.setAccessToken(accessToken);
    }

    this.youtubeDownloader = new YouTubeDownloader();
    this.initializeAuth();
  }

  /**
   * Initialize Spotify API authentication
   */
  private async initializeAuth(): Promise<void> {
    try {
      if (this.accessToken) return;

      const credentials = this.config.getApiCredentials().spotify;
      
      if (!credentials?.clientId || !credentials?.clientSecret) {
        this.logger.warn('Spotify API credentials not found, falling back to scraping');
        return;
      }

      const data = await this.spotifyApi.clientCredentialsGrant();
      this.accessToken = data.body.access_token;
      this.spotifyApi.setAccessToken(this.accessToken);
      
      this.logger.info('Spotify API authenticated successfully');
    } catch (error) {
      this.logger.error('Failed to authenticate with Spotify API', error);
    }
  }

  /**
   * Search tracks on Spotify
   */
  async searchTracks(query: string, maxResults: number = 10): Promise<SearchResult> {
    this.logger.info(`Searching Spotify for: ${query}`);

    try {
      if (this.accessToken) {
        return await this.searchWithApi(query, maxResults);
      } else if (this.config.shouldFallbackToScraping()) {
        return await this.searchWithScraping(query, maxResults);
      }

      return { tracks: [], playlists: [], source: MusicSource.SPOTIFY };
    } catch (error) {
      this.logger.error('Error searching Spotify', error);
      
      if (this.config.shouldFallbackToScraping()) {
        return await this.searchWithScraping(query, maxResults);
      }

      return { tracks: [], playlists: [], source: MusicSource.SPOTIFY };
    }
  }

  /**
   * Search using Spotify API
   */
  private async searchWithApi(query: string, maxResults: number): Promise<SearchResult> {
    try {
      const result = await this.spotifyApi.searchTracks(query, { limit: maxResults });
      const tracks: Track[] = [];

      for (const item of result.body.tracks.items) {
        tracks.push({
          id: item.id,
          title: item.name,
          artist: item.artists.map(a => a.name).join(', '),
          album: item.album.name,
          duration: Math.floor(item.duration_ms / 1000),
          url: item.external_urls.spotify,
          source: MusicSource.SPOTIFY,
          thumbnailUrl: item.album.images[0]?.url,
          year: parseInt(item.album.release_date.split('-')[0]),
          trackNumber: item.track_number,
          isrc: item.external_ids?.isrc
        });
      }

      return { tracks, playlists: [], source: MusicSource.SPOTIFY };
    } catch (error) {
      this.logger.error('Error searching with Spotify API', error);
      throw error;
    }
  }

  /**
   * Search using web scraping
   */
  private async searchWithScraping(query: string, maxResults: number): Promise<SearchResult> {
    let browser;
    
    try {
      const scrapingOptions = this.config.getScrapingOptions();
      
      browser = await puppeteer.launch({
        headless: scrapingOptions.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setUserAgent(scrapingOptions.userAgent || '');

      const searchUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });

      await page.waitForTimeout(scrapingOptions.delay || 2000);

      const tracks = await page.evaluate((maxResults) => {
        const trackElements = document.querySelectorAll('[data-testid="tracklist-row"]');
        const results: any[] = [];

        for (let i = 0; i < Math.min(trackElements.length, maxResults); i++) {
          const element = trackElements[i];
          const titleElement = element.querySelector('[data-testid="internal-track-link"]');
          const artistElement = element.querySelector('[data-testid="track-artist"]');

          if (titleElement && artistElement) {
            results.push({
              title: titleElement.textContent?.trim(),
              artist: artistElement.textContent?.trim(),
              url: titleElement.getAttribute('href')
            });
          }
        }

        return results;
      }, maxResults);

      const formattedTracks: Track[] = tracks.map((track, index) => ({
        id: `scraped-${index}`,
        title: track.title || 'Unknown',
        artist: track.artist || 'Unknown',
        url: track.url ? `https://open.spotify.com${track.url}` : '',
        source: MusicSource.SPOTIFY
      }));

      return { tracks: formattedTracks, playlists: [], source: MusicSource.SPOTIFY };
    } catch (error) {
      this.logger.error('Error scraping Spotify', error);
      return { tracks: [], playlists: [], source: MusicSource.SPOTIFY };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Download track (searches on YouTube and downloads)
   */
  async downloadTrack(track: Track, outputPath: string): Promise<DownloadResult> {
    this.logger.info(`Searching YouTube for: ${track.artist} - ${track.title}`);

    try {
      // Try multiple search strategies
      const searchQueries = [
        `${track.artist} ${track.title}`,
        `${track.artist} ${track.title} official audio`,
        `${track.artist} ${track.title} official video`,
        `${track.title} ${track.artist}`,
        track.album ? `${track.artist} ${track.title} ${track.album}` : null
      ].filter(Boolean) as string[];

      let youtubeResults;
      let foundQuery = '';

      // Try each search query until we find results
      for (const query of searchQueries) {
        this.logger.info(`Trying YouTube search: ${query}`);
        youtubeResults = await this.youtubeDownloader.searchTracks(query, 3);
        
        if (youtubeResults.tracks.length > 0) {
          foundQuery = query;
          break;
        }
      }

      if (!youtubeResults || youtubeResults.tracks.length === 0) {
        return {
          track,
          success: false,
          error: 'No matching track found on YouTube after multiple search attempts',
          source: MusicSource.SPOTIFY
        };
      }

      this.logger.info(`Found match with query: ${foundQuery}`);

      // Download the first match from YouTube
      const youtubeTrack = youtubeResults.tracks[0];
      
      // Merge metadata from Spotify with YouTube track
      const mergedTrack: Track = {
        ...youtubeTrack,
        artist: track.artist,
        title: track.title,
        album: track.album,
        year: track.year,
        genre: track.genre,
        trackNumber: track.trackNumber,
        thumbnailUrl: track.thumbnailUrl || youtubeTrack.thumbnailUrl
      };

      return await this.youtubeDownloader.downloadTrack(mergedTrack, outputPath);
    } catch (error) {
      this.logger.error(`Error downloading ${track.title}`, error);
      return {
        track,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: MusicSource.SPOTIFY
      };
    }
  }

  /**
   * Check if URL is a Spotify playlist
   */
  static isPlaylistUrl(url: string): boolean {
    return /open\.spotify\.com\/playlist\//.test(url);
  }

  /**
   * Check if URL is a Spotify track
   */
  static isTrackUrl(url: string): boolean {
    return /open\.spotify\.com\/track\//.test(url);
  }

  // Legacy methods for compatibility
  async downloadAudio(trackId: string): Promise<void> {
    const trackData = await this.fetchMetadata(trackId);
    if (trackData) {
      this.logger.info(`Downloading audio for: ${trackData.title} by ${trackData.artist}`);
      // Use the new download method
      const track: Track = {
        id: trackId,
        title: trackData.title,
        artist: trackData.artist,
        url: '',
        source: MusicSource.SPOTIFY,
        thumbnailUrl: trackData.coverArt
      };
      // Implementation would call downloadTrack
    }
  }

  async fetchMetadata(trackId: string): Promise<{ title: string; artist: string; coverArt: string } | null> {
    try {
      if (!this.accessToken) {
        await this.initializeAuth();
      }

      const response = await axios.get(`${this.apiUrl}/tracks/${trackId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });
      
      const track = response.data;
      return {
        title: track.name,
        artist: track.artists.map((artist: any) => artist.name).join(', '),
        coverArt: track.album.images[0]?.url || ''
      };
    } catch (error) {
      this.logger.error('Error fetching metadata from Spotify:', error);
      return null;
    }
  }
}