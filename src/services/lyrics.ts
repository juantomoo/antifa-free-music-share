import axios from 'axios';
import { Logger } from '../utils/logger';

export interface LyricsResult {
  lyrics: string;
  source: string;
  url?: string;
}

export class LyricsService {
  private logger = Logger.getInstance();
  private geniusToken: string | null = null;
  private geniusBaseUrl = 'https://api.genius.com';

  constructor() {
    this.geniusToken = process.env.GENIUS_ACCESS_TOKEN || null;
  }

  /**
   * Search for lyrics from multiple sources
   */
  async searchLyrics(artist: string, title: string): Promise<LyricsResult | null> {
    // Try Genius first if token is available
    if (this.geniusToken) {
      const geniusResult = await this.searchGenius(artist, title);
      if (geniusResult) {
        return geniusResult;
      }
    }

    // Try other sources as fallback
    const azResult = await this.searchAZLyrics(artist, title);
    if (azResult) {
      return azResult;
    }

    return null;
  }

  /**
   * Search Genius for lyrics
   */
  private async searchGenius(artist: string, title: string): Promise<LyricsResult | null> {
    try {
      if (!this.geniusToken) {
        return null;
      }

      // Search for the song
      const searchResponse = await axios.get(`${this.geniusBaseUrl}/search`, {
        params: {
          q: `${artist} ${title}`
        },
        headers: {
          'Authorization': `Bearer ${this.geniusToken}`
        },
        timeout: 10000
      });

      if (searchResponse.data.response.hits.length === 0) {
        return null;
      }

      const hit = searchResponse.data.response.hits[0];
      const songUrl = hit.result.url;
      const songId = hit.result.id;

      // Genius API doesn't provide lyrics directly, but we can return the URL
      this.logger.info(`Found lyrics on Genius: ${songUrl}`);

      // Try to scrape lyrics from the page
      const lyrics = await this.scrapeLyricsFromUrl(songUrl);
      
      if (lyrics) {
        return {
          lyrics,
          source: 'Genius',
          url: songUrl
        };
      }

      return {
        lyrics: `Lyrics available at: ${songUrl}`,
        source: 'Genius',
        url: songUrl
      };

    } catch (error: any) {
      this.logger.debug(`Genius search failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Search AZLyrics (web scraping - use responsibly)
   */
  private async searchAZLyrics(artist: string, title: string): Promise<LyricsResult | null> {
    try {
      // Normalize artist and title for URL
      const normalizeForUrl = (str: string) => {
        return str
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .trim();
      };

      const artistNorm = normalizeForUrl(artist);
      const titleNorm = normalizeForUrl(title);
      const url = `https://www.azlyrics.com/lyrics/${artistNorm}/${titleNorm}.html`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      // Simple extraction - this is fragile and may break
      const html = response.data;
      const match = html.match(/<!-- Usage of azlyrics\.com content.*?-->(.*?)<!-- MxM banner -->/s);
      
      if (match && match[1]) {
        const lyrics = match[1]
          .replace(/<[^>]+>/g, '')
          .replace(/\r\n/g, '\n')
          .trim();

        if (lyrics.length > 50) {
          return {
            lyrics,
            source: 'AZLyrics',
            url
          };
        }
      }

      return null;

    } catch (error: any) {
      this.logger.debug(`AZLyrics search failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Generic web scraping for lyrics (basic implementation)
   */
  private async scrapeLyricsFromUrl(url: string): Promise<string | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const html = response.data;
      
      // Try to find common lyrics containers
      const patterns = [
        /<div[^>]*class="[^"]*lyrics[^"]*"[^>]*>(.*?)<\/div>/is,
        /<div[^>]*data-lyrics-container[^>]*>(.*?)<\/div>/is,
        /<p[^>]*class="[^"]*lyrics[^"]*"[^>]*>(.*?)<\/p>/is
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const lyrics = match[1]
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();

          if (lyrics.length > 50) {
            return lyrics;
          }
        }
      }

      return null;

    } catch (error: any) {
      this.logger.debug(`Web scraping failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Embed lyrics in MP3 file
   */
  async embedLyrics(filePath: string, lyrics: string): Promise<void> {
    try {
      const NodeID3 = require('node-id3');
      const tags = NodeID3.read(filePath) || {};
      
      tags.unsynchronisedLyrics = {
        language: 'eng',
        shortText: 'Lyrics',
        text: lyrics
      };

      NodeID3.write(tags, filePath);
      this.logger.info(`Lyrics embedded in: ${filePath}`);

    } catch (error: any) {
      this.logger.warn(`Failed to embed lyrics: ${error.message}`);
      throw error;
    }
  }
}
