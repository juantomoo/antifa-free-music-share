import youtubedl from 'youtube-dl-exec';
import { Track, Playlist, MusicSource, DownloadResult, SearchResult } from '../types';
import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config';
import { FileHelper } from '../utils/file-helper';
import axios from 'axios';
import { execSync } from 'child_process';

export class YouTubeDownloader {
  private logger = Logger.getInstance();
  private config = ConfigManager.getInstance();
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for tracks on YouTube Music using ytmusicapi
   */
  async searchTracks(query: string, maxResults: number = 10): Promise<SearchResult> {
    this.logger.info(`Searching YouTube Music for: ${query}`);

    try {
      // Use Python ytmusicapi script for accurate YouTube Music results
      const scriptPath = require('path').join(__dirname, '../../ytmusic_search.py');
      
      const jsonOutput = execSync(`python3 "${scriptPath}" "${query}"`, {
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
        timeout: 30000
      });

      const results = JSON.parse(jsonOutput);
      
      // Check for errors
      if (results.error) {
        this.logger.error(`YouTube Music search error: ${results.error}`);
        return { tracks: [], playlists: [], source: MusicSource.YOUTUBE_MUSIC };
      }

      const tracks: Track[] = [];
      
      // Process results (limited by maxResults)
      const limitedResults = Array.isArray(results) ? results.slice(0, maxResults) : [];
      
      for (const item of limitedResults) {
        if (!item.videoId) continue;

        tracks.push({
          id: item.videoId,
          title: item.title || 'Unknown Title',
          artist: item.artist || 'Unknown Artist',
          album: item.album || undefined,
          duration: item.duration || 0,
          url: item.url || `https://music.youtube.com/watch?v=${item.videoId}`,
          source: MusicSource.YOUTUBE_MUSIC,
          thumbnailUrl: item.thumbnailUrl || undefined,
          year: item.year || undefined
        });
      }

      this.logger.info(`Found ${tracks.length} YouTube Music tracks`);
      return { tracks, playlists: [], source: MusicSource.YOUTUBE_MUSIC };
      
    } catch (error) {
      this.logger.error('Error searching YouTube Music', error);
      return { tracks: [], playlists: [], source: MusicSource.YOUTUBE_MUSIC };
    }
  }

  /**
   * Download a track
   */
  async downloadTrack(track: Track, outputPath: string): Promise<DownloadResult> {
    this.logger.info(`Downloading: ${track.artist} - ${track.title}`);

    try {
      const downloadOptions = this.config.getConfig().downloadOptions;
      
      // Get best audio format based on quality setting
      const formatSelector = this.getFormatSelector(downloadOptions.quality);

      await youtubedl(track.url, {
        format: formatSelector,
        output: outputPath,
        audioFormat: downloadOptions.format,
        audioQuality: 0,
        extractAudio: true,
        quiet: true,
        noWarnings: true
      });

      this.logger.success(`Downloaded: ${track.title}`);
      return {
        track,
        filePath: outputPath,
        success: true,
        source: track.source
      };
    } catch (error) {
      this.logger.error(`Error downloading ${track.title}`, error);
      return {
        track,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: track.source
      };
    }
  }

  /**
   * Get playlist information (simplified)
   */
  async getPlaylist(playlistUrl: string): Promise<Playlist | null> {
    this.logger.info(`Fetching playlist: ${playlistUrl}`);

    try {
      // Simplified implementation
      return {
        id: 'playlist-id',
        title: 'Sample Playlist',
        description: '',
        tracks: [],
        source: MusicSource.YOUTUBE,
        url: playlistUrl,
        totalTracks: 0
      };
    } catch (error) {
      this.logger.error('Error fetching playlist', error);
      return null;
    }
  }

  /**
   * Get format selector based on quality
   */
  private getFormatSelector(quality: string): string {
    switch (quality) {
      case '96k':
        return 'bestaudio[abr<=96]';
      case '192k':
        return 'bestaudio[abr<=192]';
      case '320k':
        return 'bestaudio[abr<=320]';
      case 'flac':
        return 'bestaudio';
      default:
        return 'bestaudio';
    }
  }

  /**
   * Check if URL is a YouTube Music playlist
   */
  static isPlaylistUrl(url: string): boolean {
    return /(?:youtube\.com\/playlist|music\.youtube\.com\/playlist|youtube\.com\/watch.*list=)/i.test(url);
  }

  /**
   * Check if URL is a YouTube Music track
   */
  static isTrackUrl(url: string): boolean {
    return /(?:youtube\.com\/watch|music\.youtube\.com\/watch|youtu\.be\/)/i.test(url);
  }

  // Legacy methods for compatibility
  async downloadAudio(videoId: string, outputPath: string): Promise<void> {
    const track: Track = {
      id: videoId,
      title: 'Unknown',
      artist: 'Unknown',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      source: MusicSource.YOUTUBE
    };
    
    await this.downloadTrack(track, outputPath);
  }

  async fetchMetadata(videoId: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not provided');
    }

    try {
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
        params: {
          id: videoId,
          key: this.apiKey,
          part: 'snippet'
        }
      });
      
      const data = response.data;
      if (data.items && data.items.length > 0) {
        const { title, channelTitle, thumbnails } = data.items[0].snippet;
        return {
          title,
          artist: channelTitle,
          coverArt: thumbnails?.high?.url
        };
      } else {
        throw new Error('No metadata found for this video.');
      }
    } catch (error) {
      this.logger.error('Error fetching metadata:', error);
      throw error;
    }
  }
}

export default YouTubeDownloader;