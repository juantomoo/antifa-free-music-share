import youtubedl from 'youtube-dl-exec';
import { Track, Playlist, MusicSource, DownloadResult, SearchResult } from '../types';
import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config';
import { FileHelper } from '../utils/file-helper';
import axios from 'axios';

export class YouTubeDownloader {
  private logger = Logger.getInstance();
  private config = ConfigManager.getInstance();
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for tracks on YouTube Music
   */
  async searchTracks(query: string, maxResults: number = 10): Promise<SearchResult> {
    this.logger.info(`Searching YouTube for: ${query}`);

    try {
      // Use yt-dlp to search YouTube Music
      const searchUrl = `ytsearch${maxResults}:${query}`;
      
      const result = await youtubedl(searchUrl, {
        dumpSingleJson: true,
        noWarnings: true,
        noPlaylist: true,
        flatPlaylist: true,
        skipDownload: true
      });

      const tracks: Track[] = [];
      
      // Handle both single result and array of results
      const resultData: any = result;
      const entries = Array.isArray(resultData) ? resultData : 
                     resultData.entries ? resultData.entries : [resultData];

      for (const entry of entries) {
        if (!entry || !entry.id) continue;

        tracks.push({
          id: entry.id,
          title: entry.title || 'Unknown Title',
          artist: entry.uploader || entry.channel || 'Unknown Artist',
          album: entry.album || undefined,
          duration: entry.duration || 0,
          url: `https://www.youtube.com/watch?v=${entry.id}`,
          source: MusicSource.YOUTUBE,
          thumbnailUrl: entry.thumbnail || entry.thumbnails?.[0]?.url,
          year: entry.upload_date ? parseInt(entry.upload_date.substring(0, 4)) : undefined
        });
      }

      return { tracks, playlists: [], source: MusicSource.YOUTUBE };
    } catch (error) {
      this.logger.error('Error searching YouTube', error);
      return { tracks: [], playlists: [], source: MusicSource.YOUTUBE };
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