/**
 * Bridge between Electron and CLI TypeScript code
 * This module exposes CLI functionality to the Electron main process
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

class DownloaderBridge {
  constructor() {
    // Detect if running in packaged app or development
    const { app } = require('electron');
    const isDev = !app.isPackaged;
    
    if (isDev) {
      // Development: use project root path
      this.ytmusicSearchScript = path.join(__dirname, '../ytmusic_search.py');
      this.downloadersPath = path.join(__dirname, '../dist');
    } else {
      // Production: use resources path
      this.ytmusicSearchScript = path.join(process.resourcesPath, 'ytmusic_search.py');
      this.downloadersPath = path.join(process.resourcesPath, 'app.asar.unpacked/dist');
    }
    
    console.log('[Bridge] Script path:', this.ytmusicSearchScript);
    console.log('[Bridge] Downloaders path:', this.downloadersPath);
  }

  /**
   * Search tracks using ytmusicapi
   */
  async searchTracks(query, limit = 10) {
    try {
      console.log(`[Bridge] Searching for: ${query}`);
      
      const result = execSync(`python3 "${this.ytmusicSearchScript}" "${query}" ${limit}`, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      });

      const tracks = JSON.parse(result);
      console.log(`[Bridge] Found ${tracks.length} tracks`);
      
      return {
        success: true,
        tracks: tracks.map(track => ({
          id: track.videoId,
          title: track.title,
          artist: track.artist,
          album: track.album || 'Unknown Album',
          duration: track.duration,
          url: track.url,
          thumbnailUrl: track.thumbnailUrl,
          source: 'youtube_music'
        }))
      };
    } catch (error) {
      console.error('[Bridge] Search error:', error.message);
      return {
        success: false,
        error: error.message,
        tracks: []
      };
    }
  }

  /**
   * Download a single track
   */
  async downloadTrack(track, downloadPath, progressCallback) {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[Bridge] Downloading: ${track.artist} - ${track.title}`);
        
        const outputTemplate = path.join(downloadPath, '%(artist)s - %(title)s.%(ext)s');
        
        const args = [
          '--format', 'bestaudio',
          '--extract-audio',
          '--audio-format', 'mp3',
          '--audio-quality', '0',
          '--embed-thumbnail',
          '--embed-metadata',
          '--output', outputTemplate,
          '--no-warnings',  // Suppress warnings
          '--quiet',        // Quiet mode
          '--progress',     // But show progress
          '--newline',
          track.url
        ];

        const ytdlp = spawn('yt-dlp', args);
        
        let output = '';
        
        ytdlp.stdout.on('data', (data) => {
          output += data.toString();
          const lines = output.split('\n');
          
          // Parse progress from yt-dlp output
          for (const line of lines) {
            if (line.includes('[download]') && line.includes('%')) {
              const match = line.match(/(\d+\.?\d*)%/);
              if (match && progressCallback) {
                const percentage = parseFloat(match[1]);
                progressCallback({
                  message: `📥 Descargando: ${track.artist} - ${track.title}`,
                  percentage: percentage,
                  track: track
                });
              }
            }
          }
        });

        ytdlp.stderr.on('data', (data) => {
          // Only log errors, not warnings
          const stderr = data.toString();
          if (stderr.includes('ERROR')) {
            console.error(`[Bridge] yt-dlp error:`, stderr);
          }
        });

        ytdlp.on('close', (code) => {
          if (code === 0) {
            console.log(`[Bridge] Download completed: ${track.title}`);
            resolve({
              success: true,
              track: track,
              path: downloadPath
            });
          } else {
            reject(new Error(`yt-dlp exited with code ${code}`));
          }
        });

        ytdlp.on('error', (error) => {
          console.error(`[Bridge] Spawn error:`, error);
          reject(error);
        });

      } catch (error) {
        console.error(`[Bridge] Download error:`, error);
        reject(error);
      }
    });
  }

  /**
   * Get playlist tracks
   */
  async getPlaylistTracks(playlistUrl, progressCallback) {
    try {
      console.log(`[Bridge] Getting playlist info: ${playlistUrl}`);
      
      if (progressCallback) {
        progressCallback({
          message: '🔍 Extrayendo información de la playlist...',
          percentage: 0
        });
      }

      // Get playlist info using yt-dlp (faster, no metadata yet)
      const playlistInfo = execSync(`yt-dlp --flat-playlist --dump-json "${playlistUrl}" 2>/dev/null`, {
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024
      });

      const lines = playlistInfo.trim().split('\n');
      const tracks = [];
      
      for (const line of lines) {
        try {
          const info = JSON.parse(line);
          if (info.id || info.url) {
            // Return basic info immediately, metadata will be fetched during download
            tracks.push({
              id: info.id,
              title: info.title || 'Unknown Track',
              artist: info.uploader?.replace(' - Topic', '') || 'Unknown Artist',
              album: 'Unknown Album',
              duration: info.duration || 0,
              url: info.url || `https://music.youtube.com/watch?v=${info.id}`,
              thumbnailUrl: null,
              source: 'youtube_music'
            });
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }

      console.log(`[Bridge] Found ${tracks.length} videos in playlist`);

      if (progressCallback) {
        progressCallback({
          message: `✅ Encontradas ${tracks.length} canciones. Listas para descargar.`,
          percentage: 100
        });
      }

      return {
        success: true,
        tracks: tracks
      };

    } catch (error) {
      console.error('[Bridge] Playlist error:', error.message);
      return {
        success: false,
        error: error.message,
        tracks: []
      };
    }
  }

  /**
   * Get metadata for a single track
   */
  async getTrackMetadata(url) {
    try {
      const result = execSync(`yt-dlp --dump-json "${url}" 2>/dev/null`, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000
      });

      const metadata = JSON.parse(result);
      
      return {
        id: metadata.id,
        title: metadata.track || metadata.title || 'Unknown Track',
        artist: metadata.artist || metadata.uploader?.replace(' - Topic', '') || 'Unknown Artist',
        album: metadata.album || 'Unknown Album',
        duration: metadata.duration || 0,
        url: url,
        thumbnailUrl: metadata.thumbnail || null,
        source: 'youtube_music'
      };
    } catch (error) {
      console.error(`[Bridge] Metadata error for ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Download multiple tracks in parallel
   */
  async downloadTracks(tracks, downloadPath, progressCallback, concurrency = 3) {
    const results = [];
    const total = tracks.length;
    let completed = 0;
    let failed = 0;

    // Ensure download directory exists
    await fs.ensureDir(downloadPath);

    // Process tracks in batches
    for (let i = 0; i < tracks.length; i += concurrency) {
      const batch = tracks.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (track) => {
        try {
          const result = await this.downloadTrack(track, downloadPath, (progress) => {
            if (progressCallback) {
              progressCallback({
                ...progress,
                current: completed + 1,
                total: total,
                percentage: Math.round((completed / total) * 100)
              });
            }
          });
          
          completed++;
          results.push(result);
          
          if (progressCallback) {
            progressCallback({
              message: `✅ Completado: ${track.artist} - ${track.title}`,
              percentage: Math.round((completed / total) * 100),
              current: completed,
              total: total
            });
          }
          
          return result;
        } catch (error) {
          failed++;
          console.error(`[Bridge] Failed to download: ${track.title}`, error);
          
          if (progressCallback) {
            progressCallback({
              message: `❌ Error: ${track.title}`,
              percentage: Math.round((completed / total) * 100),
              current: completed,
              total: total
            });
          }
          
          return {
            success: false,
            track: track,
            error: error.message
          };
        }
      });

      await Promise.all(batchPromises);
    }

    return {
      success: true,
      total: total,
      completed: completed,
      failed: failed,
      results: results
    };
  }

  /**
   * Update metadata for MP3 files in a folder using MusicBrainz
   */
  async updateMetadata(folderPath, progressCallback) {
    try {
      console.log(`[Bridge] Updating metadata for: ${folderPath}`);
      const glob = require('glob');
      const NodeID3 = require('node-id3');
      const { MetadataService } = require('../dist/services/metadata');
      
      const mp3Files = glob.sync(path.join(folderPath, '**/*.mp3'));
      
      if (mp3Files.length === 0) {
        return {
          success: false,
          error: 'No se encontraron archivos MP3 en la carpeta'
        };
      }

      progressCallback({
        message: `🔍 Analizando ${mp3Files.length} archivos...`,
        percentage: 0,
        current: 0,
        total: mp3Files.length,
        files: []
      });

      const metadataService = new MetadataService();
      let completed = 0;
      let filesProcessed = [];

      for (const file of mp3Files) {
        try {
          const basename = path.basename(file);
          
          // Read existing tags
          const existingTags = NodeID3.read(file);
          
          // Try to extract artist and title from filename or existing tags
          const artist = existingTags.artist || basename.split(' - ')[0] || 'Unknown Artist';
          const title = existingTags.title || basename.split(' - ')[1]?.replace('.mp3', '') || basename.replace('.mp3', '');
          
          // Enhance metadata
          const enhancedTrack = await metadataService.enhanceTrackMetadata({
            artist: artist,
            title: title,
            album: existingTags.album,
            year: existingTags.year
          });
          
          // Update ID3 tags
          const newTags = {
            artist: enhancedTrack.artist || artist,
            title: enhancedTrack.title || title,
            album: enhancedTrack.album || existingTags.album,
            year: enhancedTrack.year?.toString() || existingTags.year,
            genre: enhancedTrack.genre || existingTags.genre,
            trackNumber: enhancedTrack.trackNumber?.toString() || existingTags.trackNumber
          };
          
          NodeID3.write(newTags, file);
          
          completed++;
          filesProcessed.push({ name: basename, status: 'success' });
          
          progressCallback({
            message: `✅ ${basename}`,
            percentage: Math.round((completed / mp3Files.length) * 100),
            current: completed,
            total: mp3Files.length,
            files: filesProcessed.slice(-10) // Last 10 files
          });
        } catch (error) {
          console.error(`[Bridge] Metadata error for ${file}:`, error.message);
          completed++;
          filesProcessed.push({ name: path.basename(file), status: 'error' });
          
          progressCallback({
            message: `⚠️ ${path.basename(file)} (sin cambios)`,
            percentage: Math.round((completed / mp3Files.length) * 100),
            current: completed,
            total: mp3Files.length,
            files: filesProcessed.slice(-10)
          });
        }
      }

      return {
        success: true,
        total: mp3Files.length,
        completed: completed
      };
    } catch (error) {
      console.error('[Bridge] Update metadata error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add cover art to MP3 files in a folder
   */
  async addCoverArt(folderPath, progressCallback) {
    try {
      console.log(`[Bridge] Adding cover art for: ${folderPath}`);
      const glob = require('glob');
      const NodeID3 = require('node-id3');
      const { CoverArtService } = require('../dist/services/cover-art');
      
      const mp3Files = glob.sync(path.join(folderPath, '**/*.mp3'));
      
      if (mp3Files.length === 0) {
        return {
          success: false,
          error: 'No se encontraron archivos MP3 en la carpeta'
        };
      }

      progressCallback({
        message: `🔍 Procesando ${mp3Files.length} archivos...`,
        percentage: 0,
        current: 0,
        total: mp3Files.length,
        files: []
      });

      const coverArtService = new CoverArtService();
      let completed = 0;
      let filesProcessed = [];

      for (const file of mp3Files) {
        try {
          const basename = path.basename(file);
          
          // Read existing tags to get artist and title
          const tags = NodeID3.read(file);
          const artist = tags.artist || basename.split(' - ')[0] || 'Unknown Artist';
          const title = tags.title || basename.split(' - ')[1]?.replace('.mp3', '') || basename.replace('.mp3', '');
          
          // Search and download cover art
          const coverUrl = await coverArtService.searchCoverArt(artist, title, tags.album);
          
          if (coverUrl) {
            const imageBuffer = await coverArtService.downloadCoverArt(coverUrl);
            
            // Add cover to ID3 tags
            NodeID3.update({
              image: {
                mime: 'image/jpeg',
                type: { id: 3, name: 'front cover' },
                description: 'Cover',
                imageBuffer: imageBuffer
              }
            }, file);
            
            completed++;
            filesProcessed.push({ name: basename, status: 'success' });
            
            progressCallback({
              message: `🖼️ ${basename}`,
              percentage: Math.round((completed / mp3Files.length) * 100),
              current: completed,
              total: mp3Files.length,
              files: filesProcessed.slice(-10)
            });
          } else {
            throw new Error('No se encontró portada');
          }
        } catch (error) {
          console.error(`[Bridge] Cover art error for ${file}:`, error.message);
          completed++;
          filesProcessed.push({ name: path.basename(file), status: 'error' });
          
          progressCallback({
            message: `⚠️ ${path.basename(file)} (sin portada)`,
            percentage: Math.round((completed / mp3Files.length) * 100),
            current: completed,
            total: mp3Files.length,
            files: filesProcessed.slice(-10)
          });
        }
      }

      return {
        success: true,
        total: mp3Files.length,
        completed: completed
      };
    } catch (error) {
      console.error('[Bridge] Add cover art error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add lyrics to MP3 files in a folder
   */
  async addLyrics(folderPath, progressCallback) {
    try {
      console.log(`[Bridge] Adding lyrics for: ${folderPath}`);
      const glob = require('glob');
      const NodeID3 = require('node-id3');
      const { LyricsService } = require('../dist/services/lyrics');
      
      const mp3Files = glob.sync(path.join(folderPath, '**/*.mp3'));
      
      if (mp3Files.length === 0) {
        return {
          success: false,
          error: 'No se encontraron archivos MP3 en la carpeta'
        };
      }

      progressCallback({
        message: `🔍 Buscando letras para ${mp3Files.length} archivos...`,
        percentage: 0,
        current: 0,
        total: mp3Files.length,
        files: []
      });

      const lyricsService = new LyricsService();
      let completed = 0;
      let filesProcessed = [];

      for (const file of mp3Files) {
        try {
          const basename = path.basename(file);
          
          // Read existing tags to get artist and title
          const tags = NodeID3.read(file);
          const artist = tags.artist || basename.split(' - ')[0] || 'Unknown Artist';
          const title = tags.title || basename.split(' - ')[1]?.replace('.mp3', '') || basename.replace('.mp3', '');
          
          // Search for lyrics
          const lyrics = await lyricsService.searchLyrics(artist, title);
          
          if (lyrics) {
            // Add lyrics to ID3 tags
            NodeID3.update({
              unsynchronisedLyrics: {
                language: 'eng',
                shortText: '',
                text: lyrics
              }
            }, file);
            
            completed++;
            filesProcessed.push({ name: basename, status: 'success' });
            
            progressCallback({
              message: `📝 ${basename}`,
              percentage: Math.round((completed / mp3Files.length) * 100),
              current: completed,
              total: mp3Files.length,
              files: filesProcessed.slice(-10)
            });
          } else {
            throw new Error('No se encontraron letras');
          }
        } catch (error) {
          console.error(`[Bridge] Lyrics error for ${file}:`, error.message);
          completed++;
          filesProcessed.push({ name: path.basename(file), status: 'error' });
          
          progressCallback({
            message: `⚠️ ${path.basename(file)} (sin letras)`,
            percentage: Math.round((completed / mp3Files.length) * 100),
            current: completed,
            total: mp3Files.length,
            files: filesProcessed.slice(-10)
          });
        }
      }

      return {
        success: true,
        total: mp3Files.length,
        completed: completed
      };
    } catch (error) {
      console.error('[Bridge] Add lyrics error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = { DownloaderBridge };
