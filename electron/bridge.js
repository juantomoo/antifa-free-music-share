/**
 * Bridge between Electron and CLI TypeScript code
 * This module exposes CLI functionality to the Electron main process
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

class DownloaderBridge {
  constructor() {
    this.ytmusicSearchScript = path.join(__dirname, '../ytmusic_search.py');
    this.downloadersPath = path.join(__dirname, '../dist');
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
}

module.exports = { DownloaderBridge };
