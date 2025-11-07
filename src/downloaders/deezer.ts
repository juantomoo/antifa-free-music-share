import axios from 'axios';
import puppeteer from 'puppeteer';
import { Track, Playlist, MusicSource, SearchResult, DownloadResult } from '../types';
import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config';
import { YouTubeDownloader } from './youtube';

export class DeezerDownloader {
  private logger = Logger.getInstance();
  private config = ConfigManager.getInstance();
  private youtubeDownloader: YouTubeDownloader;
  private apiUrl = 'https://api.deezer.com';

  constructor() {
    this.youtubeDownloader = new YouTubeDownloader();
  }

  /**
   * Search tracks on Deezer
   */
  async searchTracks(query: string, maxResults: number = 10): Promise<SearchResult> {
    this.logger.info(`Searching Deezer for: ${query}`);

    try {
      // Try API first (no auth needed for search)
      return await this.searchWithApi(query, maxResults);
    } catch (error) {
      this.logger.error('Error searching Deezer', error);
      
      if (this.config.shouldFallbackToScraping()) {
        return await this.searchWithScraping(query, maxResults);
      }

      return { tracks: [], playlists: [], source: MusicSource.DEEZER };
    }
  }

  /**
   * Search using Deezer API (public access)
   */
  private async searchWithApi(query: string, maxResults: number): Promise<SearchResult> {
    try {
      const response = await axios.get(`${this.apiUrl}/search/track`, {
        params: {
          q: query,
          limit: maxResults
        },
        timeout: 10000
      });

      const tracks: Track[] = response.data.data.map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        artist: item.artist.name,
        album: item.album?.title,
        duration: item.duration,
        url: item.link,
        source: MusicSource.DEEZER,
        thumbnailUrl: item.album?.cover_medium,
        year: item.album?.release_date ? parseInt(item.album.release_date.split('-')[0]) : undefined,
        trackNumber: item.track_position,
        isrc: item.isrc
      }));

      return { tracks, playlists: [], source: MusicSource.DEEZER };
    } catch (error) {
      this.logger.error('Error searching with Deezer API', error);
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

      const searchUrl = `https://www.deezer.com/search/${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(scrapingOptions.delay || 2000);

      const tracks = await page.evaluate((maxResults: number) => {
        const trackElements = document.querySelectorAll('[data-testid="track-item"], .track-item');
        const results: any[] = [];

        for (let i = 0; i < Math.min(trackElements.length, maxResults); i++) {
          const element = trackElements[i];
          const titleElement = element.querySelector('.track-title, [data-testid="track-title"]');
          const artistElement = element.querySelector('.track-artist, [data-testid="track-artist"]');
          
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
        source: MusicSource.DEEZER
      }));

      return { tracks: formattedTracks, playlists: [], source: MusicSource.DEEZER };
    } catch (error) {
      this.logger.error('Error scraping Deezer', error);
      return { tracks: [], playlists: [], source: MusicSource.DEEZER };
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
          source: MusicSource.DEEZER
        };
      }

      this.logger.info(`Found match with query: ${foundQuery}`);

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
        source: MusicSource.DEEZER
      };
    }
  }

  static isPlaylistUrl(url: string): boolean {
    return /deezer\.com\/(en\/)?playlist\//.test(url);
  }

  static isTrackUrl(url: string): boolean {
    return /deezer\.com\/(en\/)?track\//.test(url);
  }
}