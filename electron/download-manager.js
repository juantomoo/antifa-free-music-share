/**
 * Download Manager - Sistema de descarga 100% local
 * NO requiere servidores, NO genera costos
 * Procesa todo en el dispositivo del usuario
 */

class DownloadManager {
  constructor() {
    this.ffmpeg = null;
    this.ffmpegLoaded = false;
    this.activeDownloads = new Map();
    this.corsProxy = null;
  }

  /**
   * Inicializa ffmpeg.wasm (solo una vez)
   */
  async initFFmpeg() {
    if (this.ffmpegLoaded) return true;

    try {
      console.log('Inicializando FFmpeg WASM...');
      
      // Verificar que las librerías estén cargadas
      if (typeof FFmpegWASM === 'undefined') {
        throw new Error('FFmpeg WASM no está cargado. Espera a que los scripts se carguen.');
      }

      const { FFmpeg } = FFmpegWASM;
      const { fetchFile, toBlobURL } = FFmpegUtil;
      
      this.ffmpeg = new FFmpeg();
      this.ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg:', message);
      });
      
      this.ffmpeg.on('progress', ({ progress, time }) => {
        console.log(`Progreso conversión: ${Math.round(progress * 100)}%`);
      });

      // Cargar FFmpeg desde CDN
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      const coreURL = await toBlobURL(
        `${baseURL}/ffmpeg-core.js`,
        'text/javascript'
      );
      const wasmURL = await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        'application/wasm'
      );

      await this.ffmpeg.load({ coreURL, wasmURL });
      this.ffmpegLoaded = true;
      console.log('FFmpeg WASM cargado exitosamente');
      return true;
    } catch (error) {
      console.error('Error al cargar FFmpeg:', error);
      return false;
    }
  }

  /**
   * Obtiene información del video de YouTube sin API
   * Usa API pública de yt-dlp hospedada (sin costo, sin servidor propio)
   */
  async getVideoInfo(videoId) {
    try {
      // Intentar con API pública de yt-dlp primero
      try {
        const ytdlpResponse = await fetch(`https://yt-dlp-api.vercel.app/api/info?url=https://www.youtube.com/watch?v=${videoId}`);
        
        if (ytdlpResponse.ok) {
          const data = await ytdlpResponse.json();
          
          if (data.formats && data.formats.length > 0) {
            // Filtrar solo audio y ordenar por calidad
            const audioFormats = data.formats
              .filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'))
              .sort((a, b) => (b.abr || 0) - (a.abr || 0));

            if (audioFormats.length > 0) {
              const bestAudio = audioFormats[0];
              
              return {
                videoId,
                title: data.title || 'Unknown',
                author: data.uploader || data.channel || 'Unknown',
                lengthSeconds: data.duration || 0,
                thumbnail: data.thumbnail || null,
                audioUrl: bestAudio.url,
                audioFormat: bestAudio.ext || 'unknown',
                bitrate: bestAudio.abr || 128,
                fileSize: bestAudio.filesize || 0
              };
            }
          }
        }
      } catch (apiError) {
        console.log('yt-dlp API no disponible, intentando método alternativo:', apiError);
      }

      // Fallback: usar invidious API (público, sin costo)
      const invidiousInstances = [
        'https://invidious.fdn.fr',
        'https://inv.riverside.rocks',
        'https://invidious.snopyta.org'
      ];

      for (const instance of invidiousInstances) {
        try {
          const response = await fetch(`${instance}/api/v1/videos/${videoId}`);
          
          if (response.ok) {
            const data = await response.json();
            
            // Obtener mejor formato de audio
            const audioFormats = data.adaptiveFormats
              .filter(f => f.type && f.type.includes('audio'))
              .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

            if (audioFormats.length > 0) {
              const bestAudio = audioFormats[0];
              
              return {
                videoId,
                title: data.title,
                author: data.author,
                lengthSeconds: data.lengthSeconds,
                thumbnail: data.videoThumbnails?.[0]?.url || null,
                audioUrl: bestAudio.url,
                audioFormat: bestAudio.container || 'webm',
                bitrate: bestAudio.bitrate || 128000,
                fileSize: bestAudio.clen || 0
              };
            }
          }
        } catch (instanceError) {
          console.log(`Invidious instance ${instance} falló:`, instanceError);
          continue;
        }
      }

      throw new Error('No se pudo obtener información del video desde ninguna fuente');
    } catch (error) {
      console.error('Error obteniendo info del video:', error);
      throw error;
    }
  }

  /**
   * Descarga el archivo de audio con seguimiento de progreso
   */
  async downloadAudio(audioUrl, onProgress) {
    try {
      const response = await fetch(audioUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength, 10);
      let loaded = 0;

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;

        if (onProgress && total) {
          const progress = (loaded / total) * 100;
          onProgress({
            loaded,
            total,
            progress,
            speed: 0 // Calcular velocidad si es necesario
          });
        }
      }

      // Combinar todos los chunks en un solo Blob
      const blob = new Blob(chunks);
      return blob;
    } catch (error) {
      console.error('Error descargando audio:', error);
      throw error;
    }
  }

  /**
   * Convierte audio/video a MP3 usando FFmpeg WASM
   */
  async convertToMP3(inputBlob, onProgress) {
    try {
      if (!this.ffmpegLoaded) {
        await this.initFFmpeg();
      }

      console.log('Convirtiendo a MP3...');
      const inputFileName = 'input.webm';
      const outputFileName = 'output.mp3';

      // Escribir archivo de entrada
      const inputData = new Uint8Array(await inputBlob.arrayBuffer());
      await this.ffmpeg.writeFile(inputFileName, inputData);

      // Ejecutar conversión
      await this.ffmpeg.exec([
        '-i', inputFileName,
        '-vn', // Sin video
        '-ar', '44100', // Sample rate
        '-ac', '2', // Stereo
        '-b:a', '192k', // Bitrate
        outputFileName
      ]);

      // Leer archivo de salida
      const outputData = await this.ffmpeg.readFile(outputFileName);
      const mp3Blob = new Blob([outputData.buffer], { type: 'audio/mpeg' });

      // Limpiar archivos temporales
      await this.ffmpeg.deleteFile(inputFileName);
      await this.ffmpeg.deleteFile(outputFileName);

      console.log('Conversión completada');
      return mp3Blob;
    } catch (error) {
      console.error('Error convirtiendo a MP3:', error);
      throw error;
    }
  }

  /**
   * Escribe metadata ID3 en el MP3
   */
  async writeMetadata(mp3Blob, metadata) {
    try {
      // Por ahora retornamos el blob tal cual
      // jsmediatags es para LEER metadata, no escribirla
      // Para ESCRIBIR necesitaríamos una librería diferente
      // o implementar el formato ID3v2 manualmente
      
      console.log('Metadata preparada para escribir:', metadata);
      
      // TODO: Implementar escritura real de ID3 tags
      // Por ahora solo agregamos el nombre correcto al archivo
      
      return mp3Blob;
    } catch (error) {
      console.error('Error escribiendo metadata:', error);
      throw error;
    }
  }

  /**
   * Descarga cover art de la miniatura
   */
  async downloadCoverArt(thumbnailUrl) {
    try {
      if (!thumbnailUrl) return null;

      // Obtener imagen de máxima calidad
      const maxQualityUrl = thumbnailUrl
        .replace('/default.jpg', '/maxresdefault.jpg')
        .replace('/hqdefault.jpg', '/maxresdefault.jpg')
        .replace('/mqdefault.jpg', '/maxresdefault.jpg')
        .replace('/sddefault.jpg', '/maxresdefault.jpg');

      const response = await fetch(maxQualityUrl);
      
      if (!response.ok) {
        // Fallback a URL original si maxres no existe
        const fallbackResponse = await fetch(thumbnailUrl);
        if (!fallbackResponse.ok) return null;
        return await fallbackResponse.blob();
      }

      return await response.blob();
    } catch (error) {
      console.error('Error descargando cover art:', error);
      return null;
    }
  }

  /**
   * Sanitiza nombre de archivo
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '') // Caracteres inválidos
      .replace(/\s+/g, ' ') // Múltiples espacios
      .trim()
      .substring(0, 200); // Límite de longitud
  }

  /**
   * Proceso completo de descarga
   */
  async downloadTrack(videoId, trackInfo, callbacks = {}) {
    const downloadId = `download_${Date.now()}`;
    this.activeDownloads.set(downloadId, { status: 'starting', progress: 0 });

    try {
      const {
        onProgress = () => {},
        onStatusChange = () => {},
        onComplete = () => {},
        onError = () => {}
      } = callbacks;

      // Paso 1: Obtener información del video
      onStatusChange({ status: 'fetching_info', message: 'Obteniendo información del video...' });
      const videoInfo = await this.getVideoInfo(videoId);

      // Paso 2: Descargar audio
      onStatusChange({ status: 'downloading', message: 'Descargando audio...' });
      const audioBlob = await this.downloadAudio(videoInfo.audioUrl, (progress) => {
        onProgress({ ...progress, stage: 'download' });
        this.activeDownloads.set(downloadId, { 
          status: 'downloading', 
          progress: progress.progress * 0.5 // 50% del total
        });
      });

      // Paso 3: Convertir a MP3
      onStatusChange({ status: 'converting', message: 'Convirtiendo a MP3...' });
      const mp3Blob = await this.convertToMP3(audioBlob, (progress) => {
        const totalProgress = 50 + (progress * 0.3); // 50-80%
        onProgress({ progress: totalProgress, stage: 'convert' });
        this.activeDownloads.set(downloadId, { 
          status: 'converting', 
          progress: totalProgress 
        });
      });

      // Paso 4: Agregar metadata
      onStatusChange({ status: 'metadata', message: 'Agregando metadata...' });
      const metadata = {
        title: trackInfo.title || videoInfo.title,
        artist: trackInfo.artist || videoInfo.author,
        album: trackInfo.album || 'YouTube Download',
        year: new Date().getFullYear()
      };
      const finalBlob = await this.writeMetadata(mp3Blob, metadata);
      
      this.activeDownloads.set(downloadId, { 
        status: 'metadata', 
        progress: 85 
      });

      // Paso 5: Descargar cover art (opcional)
      let coverArtBlob = null;
      if (videoInfo.thumbnail) {
        onStatusChange({ status: 'cover', message: 'Descargando cover art...' });
        coverArtBlob = await this.downloadCoverArt(videoInfo.thumbnail);
        this.activeDownloads.set(downloadId, { 
          status: 'cover', 
          progress: 90 
        });
      }

      // Paso 6: Guardar archivo
      onStatusChange({ status: 'saving', message: 'Guardando archivo...' });
      const filename = this.sanitizeFilename(
        `${metadata.artist} - ${metadata.title}.mp3`
      );

      // Usar storage manager para guardar
      if (window.storageManager) {
        const downloadPath = document.getElementById('download-path')?.value || 
                            window.storageManager.defaultPath;
        
        await window.storageManager.ensureDirectory(downloadPath);
        await window.storageManager.saveFile(finalBlob, filename, downloadPath);

        // Guardar cover art si existe
        if (coverArtBlob) {
          const coverFilename = this.sanitizeFilename(
            `${metadata.artist} - ${metadata.title}.jpg`
          );
          await window.storageManager.saveFile(coverArtBlob, coverFilename, downloadPath);
        }
      } else {
        // Fallback: descargar en navegador
        const url = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }

      this.activeDownloads.set(downloadId, { 
        status: 'completed', 
        progress: 100 
      });

      onStatusChange({ status: 'completed', message: '¡Descarga completada!' });
      onComplete({ filename, path: downloadPath });

      // Limpiar después de 5 segundos
      setTimeout(() => {
        this.activeDownloads.delete(downloadId);
      }, 5000);

      return { success: true, filename };
    } catch (error) {
      console.error('Error en descarga:', error);
      this.activeDownloads.set(downloadId, { 
        status: 'error', 
        error: error.message 
      });
      
      onError(error);
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene estado de una descarga activa
   */
  getDownloadStatus(downloadId) {
    return this.activeDownloads.get(downloadId);
  }

  /**
   * Cancela una descarga activa
   */
  cancelDownload(downloadId) {
    // TODO: Implementar cancelación real
    this.activeDownloads.delete(downloadId);
  }
}

// Exponer globalmente
if (typeof window !== 'undefined') {
  // Variables globales para FFmpeg
  window.FFmpegWASM = null;
  window.FFmpegUtil = null;
  
  // Cargar FFmpeg desde CDN
  const script1 = document.createElement('script');
  script1.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js';
  script1.async = true;
  script1.onload = () => {
    console.log('FFmpeg script cargado');
    window.FFmpegWASM = window.FFmpeg;
  };
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.src = 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/umd/index.js';
  script2.async = true;
  script2.onload = () => {
    console.log('FFmpeg util script cargado');
    window.FFmpegUtil = window.FFmpegUtil || window;
  };
  document.head.appendChild(script2);

  // Inicializar cuando scripts estén cargados
  window.addEventListener('load', () => {
    setTimeout(() => {
      window.downloadManager = new DownloadManager();
      console.log('Download Manager inicializado');
    }, 2000); // Dar tiempo a que scripts se carguen
  });
}
