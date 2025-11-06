import axios from 'axios';
import puppeteer from 'puppeteer';
import { Track, Playlist, MusicSource, SearchResult, DownloadResult } from '../types';
import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config';
import { YouTubeDownloader } from './youtube';

export class TidalDownloader {
  private logger = Logger.getInstance();
  private config = ConfigManager.getInstance();
  private youtubeDownloader: YouTubeDownloader;
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
    this.youtubeDownloader = new YouTubeDownloader();
  }

  /**
   * Search tracks on Tidal
   */
  async searchTracks(query: string, maxResults: number = 10): Promise<SearchResult> {
    this.logger.info(`Searching Tidal for: ${query}`);

    try {
      if (this.config.shouldFallbackToScraping()) {
        return await this.searchWithScraping(query, maxResults);
      }

      return { tracks: [], playlists: [], source: MusicSource.TIDAL };
    } catch (error) {
      this.logger.error('Error searching Tidal', error);
      return { tracks: [], playlists: [], source: MusicSource.TIDAL };
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

      const searchUrl = `https://listen.tidal.com/search?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(scrapingOptions.delay || 3000);

      const tracks = await page.evaluate((maxResults: number) => {
        const trackElements = document.querySelectorAll('[data-test="grid-item"], .track-item');
        const results: any[] = [];

        for (let i = 0; i < Math.min(trackElements.length, maxResults); i++) {
          const element = trackElements[i];
          const titleElement = element.querySelector('[data-test="cell-title"], .track-title');
          const artistElement = element.querySelector('[data-test="cell-artist"], .track-artist');
          
          if (titleElement && artistElement) {
            results.push({
              title: titleElement.textContent?.trim(),
              artist: artistElement.textContent?.trim(),
            });
          }
        }

        return results;
      }, maxResults);

      const formattedTracks: Track[] = tracks.map((track: any, index: number) => ({
        id: `scraped-${index}`,
        title: track.title || 'Unknown',
        artist: track.artist || 'Unknown',
        url: '',
        source: MusicSource.TIDAL
      }));

      return { tracks: formattedTracks, playlists: [], source: MusicSource.TIDAL };
    } catch (error) {
      this.logger.error('Error scraping Tidal', error);
      return { tracks: [], playlists: [], source: MusicSource.TIDAL };
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
      const searchQuery = `${track.artist} ${track.title} audio`;
      const youtubeResults = await this.youtubeDownloader.searchTracks(searchQuery, 1);

      if (youtubeResults.tracks.length === 0) {
        return {
          track,
          success: false,
          error: 'No matching track found on YouTube',
          source: MusicSource.TIDAL
        };
      }

      const youtubeTrack = youtubeResults.tracks[0];
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
        source: MusicSource.TIDAL
      };
    }
  }

  static isPlaylistUrl(url: string): boolean {
    return /listen\.tidal\.com\/(playlist|album)\//.test(url);
  }

  static isTrackUrl(url: string): boolean {
    return /listen\.tidal\.com\/track\//.test(url);
  }

  // Legacy methods for compatibility
  async downloadAudio(trackId: string): Promise<void> {
    this.logger.info(`Downloading audio for track ID: ${trackId}`);
    // Implementation would call downloadTrack
  }

  async fetchMetadata(trackId: string): Promise<{ title: string; artist: string; coverArt: string }> {
    // Basic implementation - in a real scenario this would make API calls
    return {
      title: 'Sample Title',
      artist: 'Sample Artist', 
      coverArt: 'Sample Cover Art URL'
    };
  }
}