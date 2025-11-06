import { Track, MetadataInfo } from '../types';
import { Logger } from './logger';

export class FileHelper {
  private static logger = Logger.getInstance();

  /**
   * Sanitize filename by removing invalid characters
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200); // Limit length
  }

  /**
   * Generate filename from track information
   */
  static generateFilename(track: Track, format: string = 'mp3'): string {
    const artist = this.sanitizeFilename(track.artist);
    const title = this.sanitizeFilename(track.title);
    const trackNum = track.trackNumber ? String(track.trackNumber).padStart(2, '0') + '. ' : '';
    
    return `${trackNum}${artist} - ${title}.${format}`;
  }

  /**
   * Generate playlist folder name
   */
  static generatePlaylistFolderName(playlistTitle: string): string {
    return this.sanitizeFilename(playlistTitle);
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      const fs = await import('fs');
      return fs.existsSync(filePath);
    } catch (error) {
      this.logger.error('Error checking file existence', error);
      return false;
    }
  }

  /**
   * Create directory if it doesn't exist
   */
  static async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      const fs = await import('fs');
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        this.logger.debug(`Created directory: ${dirPath}`);
      }
    } catch (error) {
      this.logger.error('Error creating directory', error);
      throw error;
    }
  }

  /**
   * Add metadata to audio file
   */
  static async addMetadata(filePath: string, metadata: MetadataInfo): Promise<boolean> {
    try {
      const NodeID3 = await import('node-id3');
      
      const tags = {
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        year: metadata.year?.toString(),
        genre: metadata.genre?.join(', '),
        trackNumber: metadata.trackNumber?.toString(),
        ISRC: metadata.isrc,
        image: metadata.coverArt ? {
          mime: 'image/jpeg',
          type: { id: 3, name: 'front cover' },
          description: 'Cover Art',
          imageBuffer: metadata.coverArt
        } : undefined
      };

      const success = NodeID3.write(tags, filePath);
      if (success === true) {
        this.logger.debug(`Added metadata to: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error('Error adding metadata', error);
      return false;
    }
  }

  /**
   * Download and cache cover art
   */
  static async downloadCoverArt(url: string): Promise<Buffer | null> {
    try {
      const axios = await import('axios');
      
      const response = await axios.default.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error('Error downloading cover art', error);
      return null;
    }
  }

  /**
   * Get full file path for download
   */
  static async getDownloadPath(
    baseDir: string,
    track: Track,
    format: string = 'mp3',
    createPlaylistFolder: boolean = false,
    playlistName?: string
  ): Promise<string> {
    const path = await import('path');
    
    let downloadDir = baseDir;
    
    if (createPlaylistFolder && playlistName) {
      const playlistDir = this.generatePlaylistFolderName(playlistName);
      downloadDir = path.join(baseDir, playlistDir);
    }
    
    await this.ensureDirectoryExists(downloadDir);
    
    const filename = this.generateFilename(track, format);
    return path.join(downloadDir, filename);
  }
}

// Legacy functions for compatibility
export const saveFile = (filePath: string, data: Buffer): Promise<void> => {
  return new Promise((resolve, reject) => {
    import('fs').then(fs => {
      fs.writeFile(filePath, data, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    }).catch(reject);
  });
};

export const saveCoverArt = (coverArtPath: string, coverArtData: Buffer): Promise<void> => {
  return saveFile(coverArtPath, coverArtData);
};

export const createDirectoryIfNotExists = (dirPath: string): Promise<void> => {
  return FileHelper.ensureDirectoryExists(dirPath);
};

export const getFileName = (title: string, artist: string): string => {
  return FileHelper.generateFilename({ title, artist } as Track);
};