#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import * as fs from 'fs-extra';
import * as path from 'path';
import Table from 'cli-table3';
import { Track, Playlist, MusicSource, DownloadResult } from './types';
import { Logger } from './utils/logger';
import { ConfigManager } from './utils/config';
import { FileHelper } from './utils/file-helper';
import { YouTubeDownloader } from './downloaders/youtube';
import { SpotifyDownloader } from './downloaders/spotify';
import { DeezerDownloader } from './downloaders/deezer';
import { TidalDownloader } from './downloaders/tidal';
import { MetadataService } from './services/metadata';
import { MusicBrainzService } from './services/musicbrainz';
import { LyricsService } from './services/lyrics';
import { CoverArtService } from './services/cover-art';
import { i18n, Language } from './utils/i18n';

class YTMusicDownloader {
  private logger = Logger.getInstance();
  private config = ConfigManager.getInstance();
  private metadataService = new MetadataService();
  private musicBrainzService = new MusicBrainzService();
  private lyricsService = new LyricsService();
  private coverArtService = new CoverArtService();
  private downloaders: Map<MusicSource, any> = new Map();
  private multiBar?: cliProgress.MultiBar;
  private downloadQueue: Map<string, any> = new Map();
  private MAX_CONCURRENT_DOWNLOADS = 5; // Increased from 3 to 5

  constructor() {
    this.initializeDownloaders();
    this.setupProgressBars();
  }

  private initializeDownloaders(): void {
    this.downloaders.set(MusicSource.YOUTUBE_MUSIC, new YouTubeDownloader());
    this.downloaders.set(MusicSource.YOUTUBE, new YouTubeDownloader());
    this.downloaders.set(MusicSource.SPOTIFY, new SpotifyDownloader());
    this.downloaders.set(MusicSource.DEEZER, new DeezerDownloader());
    this.downloaders.set(MusicSource.TIDAL, new TidalDownloader());
  }

  private setupProgressBars(): void {
    this.multiBar = new cliProgress.MultiBar({
      clearOnComplete: false,
      hideCursor: true,
      format: chalk.cyan('{bar}') + ' | {percentage}% | {filename} | {size}'
    }, cliProgress.Presets.shades_classic);
  }

  /**
   * Check if file already exists
   */
  private async fileExists(filename: string): Promise<boolean> {
    const config = this.config.getConfig();
    const filePath = path.join(config.downloadOptions.outputDir, filename);
    return fs.existsSync(filePath);
  }

  /**
   * Check if file has complete metadata
   */
  private async checkMetadataCompleteness(filePath: string): Promise<{
    hasBasicInfo: boolean;
    hasCoverArt: boolean;
    metadata: any;
  }> {
    try {
      const NodeID3 = require('node-id3');
      const tags = NodeID3.read(filePath);
      
      const hasBasicInfo = tags && tags.artist && tags.artist !== 'Unknown Artist' && 
                          tags.title && tags.title.trim() !== '';
      
      const hasCoverArt = tags && tags.image && tags.image.imageBuffer;
      
      return {
        hasBasicInfo,
        hasCoverArt,
        metadata: tags
      };
    } catch (error) {
      return {
        hasBasicInfo: false,
        hasCoverArt: false,
        metadata: null
      };
    }
  }

  /**
   * Download cover art from URL
   */
  private async downloadCoverArt(url: string): Promise<Buffer | null> {
    try {
      const axios = require('axios');
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.warn(chalk.yellow(`⚠️  Failed to download cover art: ${error}`));
      return null;
    }
  }

  /**
   * Show download estimates (size, time, speed)
   */
  private async showDownloadEstimates(tracks: Array<{title: string, url: string, filename: string}>): Promise<void> {
    console.log(chalk.blue('\n📊 Calculating download estimates...'));
    
    // Estimate file sizes (average 3-4MB per song)
    const avgSizePerTrack = 3.5 * 1024 * 1024; // 3.5MB in bytes
    const estimatedTotalSize = tracks.length * avgSizePerTrack;
    const sizeInMB = (estimatedTotalSize / (1024 * 1024)).toFixed(1);
    
    // Test connection speed
    const speedTestResult = await this.testConnectionSpeed();
    
    // Estimate download time
    const downloadSpeedBps = speedTestResult.downloadSpeed * 1024 * 1024; // Convert Mbps to Bps
    const estimatedTimeSeconds = estimatedTotalSize / downloadSpeedBps;
    const timeMinutes = Math.ceil(estimatedTimeSeconds / 60);
    
    console.log(chalk.cyan(`📏 Estimated total size: ${sizeInMB} MB`));
    console.log(chalk.cyan(`🌐 Connection speed: ${speedTestResult.downloadSpeed.toFixed(1)} Mbps`));
    console.log(chalk.cyan(`⏱️  Estimated download time: ~${timeMinutes} minutes`));
    console.log(chalk.cyan(`🔗 Parallel downloads: ${this.MAX_CONCURRENT_DOWNLOADS} concurrent`));
  }

  /**
   * Test connection speed
   */
  private async testConnectionSpeed(): Promise<{downloadSpeed: number, uploadSpeed: number}> {
    try {
      // Simple speed test using a small file download
      const testStart = Date.now();
      const axios = require('axios');
      
      // Download a 1MB test file
      const response = await axios.get('https://httpbin.org/bytes/1048576', {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      const testEnd = Date.now();
      const durationSeconds = (testEnd - testStart) / 1000;
      const downloadSpeedMbps = (1 * 8) / durationSeconds; // 1MB = 8Mb
      
      return {
        downloadSpeed: Math.max(downloadSpeedMbps, 1), // Min 1 Mbps
        uploadSpeed: downloadSpeedMbps * 0.1 // Estimate upload as 10% of download
      };
    } catch (error) {
      this.logger.warn(chalk.yellow(`⚠️  Speed test failed, using default estimates`));
      return {
        downloadSpeed: 10, // Default 10 Mbps
        uploadSpeed: 1
      };
    }
  }

  /**
   * Update existing files with metadata and/or cover art
   */
  private async updateExistingFiles(
    incompleteMetadata: Array<{title: string, artist: string, filename: string}>,
    missingCoverArt: Array<{title: string, artist: string, filename: string}>,
    updateMetadata: boolean,
    updateCoverArt: boolean
  ): Promise<void> {
    console.log(chalk.blue('\n🔄 Updating existing files...'));
    
    const filesToUpdate = new Set<string>();
    
    if (updateMetadata) {
      incompleteMetadata.forEach(item => filesToUpdate.add(item.filename));
    }
    
    if (updateCoverArt) {
      missingCoverArt.forEach(item => filesToUpdate.add(item.filename));
    }
    
    const config = this.config.getConfig();
    let updated = 0;
    let failed = 0;
    
    for (const filename of filesToUpdate) {
      const filePath = path.join(config.downloadOptions.outputDir, filename);
      const titleMatch = incompleteMetadata.find(item => item.filename === filename) || 
                        missingCoverArt.find(item => item.filename === filename);
      
      if (titleMatch) {
        try {
          console.log(chalk.cyan(`🔄 Processing: ${titleMatch.artist} - ${titleMatch.title}`));
          await this.processMetadataParallelOld({ 
            title: `${titleMatch.artist} - ${titleMatch.title}`,
            artist: titleMatch.artist
          }, filePath);
          updated++;
        } catch (error) {
          this.logger.error(chalk.red(`❌ Update failed for ${titleMatch.artist} - ${titleMatch.title}: ${error}`));
          failed++;
        }
      }
    }
    
    console.log(chalk.green(`✅ Updated ${updated} files`));
    if (failed > 0) {
      console.log(chalk.red(`❌ Failed to update ${failed} files`));
    }
  }

  /**
   * Sanitize filename for filesystem
   */
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, ' ').trim();
  }

  /**
   * Search tracks across multiple sources
   */
  async searchTracks(query: string, sources?: MusicSource[]): Promise<Track[]> {
    const spinner = ora(`Searching for: ${chalk.yellow(query)}`).start();
    const searchSources = sources || this.config.getSources();
    const allTracks: Track[] = [];

    try {
      for (const source of searchSources) {
        const downloader = this.downloaders.get(source);
        if (downloader && typeof downloader.searchTracks === 'function') {
          try {
            const result = await downloader.searchTracks(query, 5);
            if (result.tracks) {
              allTracks.push(...result.tracks);
            }
          } catch (error) {
            this.logger.debug(`Search failed for ${source}`);
          }
        }
      }

      spinner.succeed(`Found ${chalk.green(allTracks.length)} tracks`);
    } catch (error) {
      spinner.fail('Search failed');
      this.logger.error('Search error:', error);
    }

    return allTracks;
  }

  /**
   * Download single track
   */
  async downloadTrack(track: Track): Promise<DownloadResult> {
    const outputPath = await FileHelper.getDownloadPath(
      this.config.getDownloadDir(),
      track,
      this.config.getConfig().downloadOptions.format,
      false
    );

    // Skip if file exists
    if (this.config.getConfig().downloadOptions.skipExisting && await FileHelper.fileExists(outputPath)) {
      this.logger.info(`Skipping existing file: ${track.title}`);
      return {
        track,
        filePath: outputPath,
        success: true,
        source: track.source
      };
    }

    // Enhance metadata
    const enhancedTrack = await this.metadataService.enhanceTrackMetadata(track);

    // Download using appropriate downloader
    const downloader = this.downloaders.get(track.source);
    if (!downloader || typeof downloader.downloadTrack !== 'function') {
      return {
        track,
        success: false,
        error: `No downloader available for ${track.source}`,
        source: track.source
      };
    }

    return await downloader.downloadTrack(enhancedTrack, outputPath);
  }

  /**
   * Interactive mode
   */
  async interactiveMode(): Promise<void> {
    // Language selection at startup (Español primero - decolonización del idioma)
    const { language } = await inquirer.prompt([
      {
        type: 'list',
        name: 'language',
        message: '🌍 Selecciona idioma / Select language / Selecione o idioma:',
        choices: i18n.getAvailableLanguages().map(lang => ({
          name: lang.name,
          value: lang.code
        }))
      }
    ]);

    i18n.setLanguage(language as Language);
    const t = i18n.t();

    // Show liberation message
    console.log(chalk.bold.red(t.banner));
    console.log(chalk.bold.yellow(t.liberationMessages.startup));
    
    // Pause for user to read the message
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: chalk.green('Press Enter to continue / Presiona Enter para continuar / Pressione Enter para continuar...'),
      }
    ]);

    console.clear();

    while (true) {
      console.log(chalk.bold.red(t.banner));
      
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: t.whatToDo,
          choices: [
            { name: t.searchAndDownload, value: 'search' },
            { name: t.downloadPlaylist, value: 'playlist' },
            new inquirer.Separator(t.separator),
            { name: t.fixMetadata, value: 'fix-metadata' },
            { name: t.addCoverArt, value: 'add-covers' },
            { name: t.addLyrics, value: 'add-lyrics' },
            { name: t.batchProcess, value: 'batch-process' },
            new inquirer.Separator(t.separator),
            { name: t.configuration, value: 'config' },
            { name: t.exit, value: 'exit' }
          ]
        }
      ]);

      switch (action) {
        case 'search':
          await this.interactiveSearch();
          break;
        case 'playlist':
          await this.interactivePlaylist();
          break;
        case 'fix-metadata':
          await this.fixMetadataMode();
          break;
        case 'add-covers':
          await this.addCoverArtMode();
          break;
        case 'add-lyrics':
          await this.addLyricsMode();
          break;
        case 'batch-process':
          await this.batchProcessMode();
          break;
        case 'config':
          await this.interactiveConfig();
          break;
        case 'exit':
          const t = i18n.t();
          console.log(chalk.bold.red('\n✊ ' + t.liberationMessages.antiMonopoly));
          console.log(chalk.bold.yellow('🎵 ' + t.liberationMessages.bandcampMessage));
          console.log(chalk.green('\n' + t.allComplete + '\n'));
          return;
      }
    }
  }

  /**
   * Interactive search and download
   */
  private async interactiveSearch(): Promise<void> {
    const { query } = await inquirer.prompt([
      {
        type: 'input',
        name: 'query',
        message: 'Enter search query:',
        validate: input => input.trim().length > 0
      }
    ]);

    const tracks = await this.searchTracks(query);
    
    if (tracks.length === 0) {
      console.log(chalk.red('No tracks found'));
      return;
    }

    const { selectedTracks } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedTracks',
        message: 'Select tracks to download:',
        choices: tracks.map(track => ({
          name: `${track.artist} - ${track.title} (${track.source})`,
          value: track
        })),
        validate: input => input.length > 0
      }
    ]);

    if (selectedTracks.length === 0) {
      console.log(chalk.yellow('No tracks selected'));
      return;
    }

    // Use the working playlist workflow for search results
    // Extract URLs and process them like playlist tracks
    console.log(chalk.blue(`\n🎵 Starting download of ${selectedTracks.length} tracks...\n`));
    
    const t = i18n.t();
    console.log(chalk.yellow(t.liberationMessages.beforeDownload));
    
    // Process each URL using the working getPlaylistTracks workflow
    const tracksToDownload = [];
    
    for (const track of selectedTracks) {
      this.logger.debug(`🔍 Processing search result track:`);
      this.logger.debug(`   Title: ${track.title}`);
      this.logger.debug(`   Artist: ${track.artist}`);
      this.logger.debug(`   URL: ${track.url}`);
      this.logger.debug(`   Album: ${track.album || 'N/A'}`);
      
      if (track.url) {
        // Use getPlaylistTracks to get full metadata (this workflow works!)
        this.logger.debug(`📥 Calling getPlaylistTracks for: ${track.url}`);
        const fullTrackData = await this.getPlaylistTracks(track.url);
        
        this.logger.debug(`📊 getPlaylistTracks returned ${fullTrackData.length} tracks`);
        if (fullTrackData.length > 0) {
          this.logger.debug(`✅ First track data:`);
          this.logger.debug(JSON.stringify(fullTrackData[0], null, 2));
          tracksToDownload.push(fullTrackData[0]);
        } else {
          this.logger.error(`❌ getPlaylistTracks returned empty array for: ${track.url}`);
        }
      } else {
        this.logger.error(`❌ Track missing URL: ${track.title}`);
      }
    }
    
    this.logger.debug(`🎵 Total tracks to download: ${tracksToDownload.length}`);
    
    if (tracksToDownload.length === 0) {
      console.log(chalk.red('Failed to process selected tracks'));
      return;
    }

    // Download using the working parallel workflow
    this.logger.debug(`🚀 Starting downloadPlaylistParallel with ${tracksToDownload.length} tracks`);
    await this.downloadPlaylistParallel(tracksToDownload);
    
    console.log(chalk.yellow('\n' + t.liberationMessages.afterDownload));
    console.log(chalk.green('\n✅ Download batch completed!'));
  }

  /**
   * Get complete track metadata from YouTube Music using yt-dlp
   */
  private async getPlaylistTracks(playlistUrl: string): Promise<Array<{
    title: string;
    artist: string;
    album: string;
    year: number | null;
    url: string;
    filename: string;
    thumbnailUrl: string | null;
  }>> {
    this.logger.debug(`📋 getPlaylistTracks called with URL: ${playlistUrl}`);
    
    const { spawn } = require('child_process');
    const { execSync } = require('child_process');
    
    // Check if it's a single video or a playlist
    const isSingleVideo = /watch\?v=/.test(playlistUrl) && !/list=/.test(playlistUrl);
    
    this.logger.debug(`🔍 URL type: ${isSingleVideo ? 'Single Video' : 'Playlist'}`);
    
    if (isSingleVideo) {
      // Handle single video directly
      console.log(chalk.blue(`🎵 Processing single track...`));
      
      try {
        this.logger.debug(`🎬 Running yt-dlp --dump-json for: ${playlistUrl}`);
        
        const jsonOutput = execSync(`yt-dlp --dump-json "${playlistUrl}"`, {
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024,
          timeout: 30000
        });
        
        this.logger.debug(`📦 yt-dlp returned ${jsonOutput.length} bytes of JSON`);
        
        const metadata = JSON.parse(jsonOutput);
        
        this.logger.debug(`🎵 Extracted metadata:`);
        this.logger.debug(`   track: ${metadata.track}`);
        this.logger.debug(`   title: ${metadata.title}`);
        this.logger.debug(`   artist: ${metadata.artist}`);
        this.logger.debug(`   artists: ${JSON.stringify(metadata.artists)}`);
        this.logger.debug(`   uploader: ${metadata.uploader}`);
        this.logger.debug(`   album: ${metadata.album}`);
        
        const track = metadata.track || metadata.title || 'Unknown Track';
        const artist = metadata.artist || metadata.artists?.[0] || metadata.uploader?.replace(' - Topic', '') || 'Unknown Artist';
        const album = metadata.album || 'Unknown Album';
        const year = metadata.release_year || null;
        
        let thumbnailUrl: string | null = null;
        if (metadata.thumbnails && Array.isArray(metadata.thumbnails)) {
          const sorted = [...metadata.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
          thumbnailUrl = sorted[0]?.url || null;
        }
        
        console.log(chalk.green(`✓ Found: ${artist} - ${track}`));
        
        // Generate filename
        const sanitizedArtist = artist.replace(/[<>:"/\\|?*]/g, '');
        const sanitizedTrack = track.replace(/[<>:"/\\|?*]/g, '');
        const filename = `${sanitizedArtist} - ${sanitizedTrack}.mp3`;
        
        const result = {
          title: track,
          artist: artist,
          album: album,
          year: year,
          url: playlistUrl,
          filename: filename,
          thumbnailUrl: thumbnailUrl
        };
        
        this.logger.debug(`✅ Returning track object:`);
        this.logger.debug(JSON.stringify(result, null, 2));
        
        return [result];
      } catch (error) {
        this.logger.error(`❌ Failed to get metadata: ${error.message}`);
        this.logger.error(`Stack trace: ${error.stack}`);
        return [];
      }
    }
    
    // Step 1: Get video URLs from playlist (fast)
    const videoUrls: string[] = [];
    const flatProcess = spawn('yt-dlp', [
      '--flat-playlist',
      '--print', '%(url)s',
      playlistUrl
    ]);
    
    let flatOutput = '';
    flatProcess.stdout.on('data', (data: Buffer) => {
      flatOutput += data.toString();
    });
    
    await new Promise((resolve) => {
      flatProcess.on('close', resolve);
    });
    
    const urls = flatOutput.trim().split('\n').filter(url => url.trim() && url !== 'NA');
    
    if (urls.length === 0) {
      this.logger.error('No valid URLs found in playlist');
      return [];
    }
    
    console.log(chalk.blue(`📋 Found ${urls.length} videos in playlist`));
    console.log(chalk.blue(`🔍 Extracting complete metadata for each track...`));
    
    // Step 2: Get complete metadata for each video (slower but accurate)
    const tracks: Array<{
      title: string;
      artist: string;
      album: string;
      year: number | null;
      url: string;
      filename: string;
      thumbnailUrl: string | null;
    }> = [];
    
    const progressBar = ora(`Processing track 0/${urls.length}`).start();
    
    for (let i = 0; i < urls.length; i++) {
      const videoUrl = urls[i];
      progressBar.text = `Processing track ${i + 1}/${urls.length}`;
      
      try {
        // Get JSON metadata for this specific video
        const jsonOutput = execSync(`yt-dlp --dump-json "${videoUrl}"`, {
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
          timeout: 30000 // 30 second timeout per track
        });
        
        const metadata = JSON.parse(jsonOutput);
        
        // Extract metadata directly from YouTube Music
        const track = metadata.track || metadata.title || 'Unknown Track';
        const artist = metadata.artist || metadata.artists?.[0] || metadata.uploader?.replace(' - Topic', '') || 'Unknown Artist';
        const album = metadata.album || 'Unknown Album';
        const year = metadata.release_year || null;
        
        // Get highest quality thumbnail
        let thumbnailUrl: string | null = null;
        if (metadata.thumbnails && Array.isArray(metadata.thumbnails)) {
          // Sort by width descending and get the first one
          const sorted = [...metadata.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
          thumbnailUrl = sorted[0]?.url || null;
        }
        
        // Generate filename
        const sanitizedArtist = artist.replace(/[<>:"/\\|?*]/g, '');
        const sanitizedTrack = track.replace(/[<>:"/\\|?*]/g, '');
        const filename = `${sanitizedArtist} - ${sanitizedTrack}.mp3`;
        
        tracks.push({
          title: track,
          artist: artist,
          album: album,
          year: year,
          url: videoUrl,
          filename: filename,
          thumbnailUrl: thumbnailUrl
        });
        
        this.logger.debug(`✓ ${artist} - ${track} (${album}, ${year || 'N/A'})`);
        
      } catch (error) {
        this.logger.warn(chalk.yellow(`⚠️  Failed to get metadata for video ${i + 1}: ${error.message}`));
        // Add basic entry so we don't lose the track
        tracks.push({
          title: 'Unknown Track',
          artist: 'Unknown Artist',
          album: 'Unknown Album',
          year: null,
          url: videoUrl,
          filename: 'Unknown Artist - Unknown Track.mp3',
          thumbnailUrl: null
        });
      }
    }
    
    progressBar.succeed(`Extracted metadata for ${tracks.length} tracks`);
    return tracks;
  }

  /**
   * Interactive playlist download with advanced features
   */
  private async interactivePlaylist(): Promise<void> {
    const { url } = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Enter playlist URL:',
        validate: input => {
          const trimmed = input.trim();
          if (!trimmed) return 'URL is required';
          return true;
        }
      }
    ]);

    const spinner = ora(`Getting playlist info...`).start();
    
    try {
      // Get complete track metadata from YouTube Music
      const ytTracks = await this.getPlaylistTracks(url);
      
      spinner.stop();
      
      if (ytTracks.length === 0) {
        this.logger.error('No tracks found in playlist');
        return;
      }
      
      // Check existing files and metadata completeness
      const config = this.config.getConfig();
      await fs.ensureDir(config.downloadOptions.outputDir);
      
      const filteredTracks: Array<{
        title: string, 
        artist: string, 
        album: string,
        year: number | null,
        url: string, 
        filename: string,
        thumbnailUrl: string | null
      }> = [];
      const incompleteMetadata: Array<{title: string, artist: string, filename: string}> = [];
      const missingCoverArt: Array<{title: string, artist: string, filename: string}> = [];
      let skippedCount = 0;
      
      console.log(chalk.blue('🔍 Analyzing existing files...'));
      
      for (const track of ytTracks) {
        const filename = this.sanitizeFilename(`${track.artist} - ${track.title}.mp3`);
        const filePath = path.join(config.downloadOptions.outputDir, filename);
        const exists = await this.fileExists(filename);
        
        if (exists) {
          // Check metadata completeness
          const metadataCheck = await this.checkMetadataCompleteness(filePath);
          
          if (!metadataCheck.hasBasicInfo) {
            incompleteMetadata.push({ title: track.title, artist: track.artist, filename });
            this.logger.info(chalk.yellow(`📝 Incomplete metadata: ${track.artist} - ${track.title}`));
          }
          
          if (!metadataCheck.hasCoverArt) {
            missingCoverArt.push({ title: track.title, artist: track.artist, filename });
            this.logger.info(chalk.yellow(`🖼️  Missing cover art: ${track.artist} - ${track.title}`));
          }
          
          if (metadataCheck.hasBasicInfo && metadataCheck.hasCoverArt) {
            skippedCount++;
            this.logger.info(chalk.green(`✅ Complete: ${track.artist} - ${track.title}`));
          }
        } else {
          filteredTracks.push({ 
            title: track.title, 
            artist: track.artist,
            album: track.album,
            year: track.year,
            url: track.url, 
            filename,
            thumbnailUrl: track.thumbnailUrl
          });
        }
      }
      
      console.log(chalk.green(`\n✅ Found ${ytTracks.length} tracks in playlist`));
      if (skippedCount > 0) {
        console.log(chalk.green(`✅ ${skippedCount} files complete (skipping)`));
      }
      if (incompleteMetadata.length > 0) {
        console.log(chalk.yellow(`📝 ${incompleteMetadata.length} files with incomplete metadata`));
      }
      if (missingCoverArt.length > 0) {
        console.log(chalk.yellow(`🖼️  ${missingCoverArt.length} files missing cover art`));
      }
      console.log(chalk.blue(`📥 ${filteredTracks.length} new tracks to download`));
      
      // Ask about updating existing files
      let updateMetadata = false;
      let updateCoverArt = false;
      
      if (incompleteMetadata.length > 0) {
        const { update } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'update',
            message: `Update metadata for ${incompleteMetadata.length} existing files?`,
            default: true
          }
        ]);
        updateMetadata = update;
      }
      
      if (missingCoverArt.length > 0) {
        const { update } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'update',
            message: `Add cover art to ${missingCoverArt.length} existing files?`,
            default: true
          }
        ]);
        updateCoverArt = update;
      }
      
      // Estimate download time and size
      if (filteredTracks.length > 0) {
        await this.showDownloadEstimates(filteredTracks);
      }
      
      if (filteredTracks.length === 0 && !updateMetadata && !updateCoverArt) {
        this.logger.info('All tracks already complete!');
        return;
      }
      
      // Process updates first
      if (updateMetadata || updateCoverArt) {
        await this.updateExistingFiles(incompleteMetadata, missingCoverArt, updateMetadata, updateCoverArt);
      }
      
      if (filteredTracks.length === 0) {
        this.logger.info('No new downloads needed.');
        return;
      }
      
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `Download ${filteredTracks.length} new tracks?`,
          default: true
        }
      ]);
      
      if (!proceed) {
        this.logger.info('Download cancelled');
        return;
      }
      
      // Advanced parallel download with metadata processing
      await this.downloadPlaylistParallel(filteredTracks);
      
    } catch (error) {
      spinner.stop();
      this.logger.error(`Failed to get playlist info: ${error}`);
    }
  }

  /**
   * Advanced parallel download with real-time progress
   */
  private async downloadPlaylistParallel(tracks: Array<{
    title: string, 
    artist: string, 
    album: string,
    year: number | null,
    url: string, 
    filename: string,
    thumbnailUrl: string | null
  }>): Promise<void> {
    this.logger.debug(`🚀 downloadPlaylistParallel called with ${tracks.length} tracks`);
    
    // Debug: Log each track to see what we're receiving
    tracks.forEach((track, index) => {
      this.logger.debug(`Track ${index + 1}:`);
      this.logger.debug(`  title: ${track.title}`);
      this.logger.debug(`  artist: ${track.artist}`);
      this.logger.debug(`  album: ${track.album}`);
      this.logger.debug(`  year: ${track.year}`);
      this.logger.debug(`  url: ${track.url}`);
      this.logger.debug(`  filename: ${track.filename || 'UNDEFINED!'}`);
      this.logger.debug(`  thumbnailUrl: ${track.thumbnailUrl || 'null'}`);
    });
    
    console.log(chalk.blue('\n🎵 Starting parallel downloads...\n'));
    
    const completedTracks: string[] = [];
    const failedTracks: string[] = [];
    
    // Create download worker function
    const downloadWorker = async (trackQueue: Array<{
      title: string, 
      artist: string, 
      album: string,
      year: number | null,
      url: string, 
      filename: string,
      thumbnailUrl: string | null
    }>) => {
      while (trackQueue.length > 0) {
        const track = trackQueue.shift();
        if (!track) break;
        
        const displayTitle = `${track.artist} - ${track.title}`;
        const progressBar = this.multiBar?.create(100, 0, {
          filename: displayTitle.slice(0, 30) + (displayTitle.length > 30 ? '...' : ''),
          size: 'Starting...'
        });
        
        try {
          await this.downloadTrackAdvanced(track, progressBar, 'worker');
          completedTracks.push(displayTitle);
        } catch (error) {
          failedTracks.push(displayTitle);
          this.logger.error(chalk.red(`❌ Failed: ${displayTitle} - ${error}`));
          progressBar?.update(100, { size: 'Failed!' });
        }
      }
    };
    
    // Create a shared queue
    const trackQueue = [...tracks];
    
    // Start worker threads
    const workers: Promise<void>[] = [];
    for (let i = 0; i < this.MAX_CONCURRENT_DOWNLOADS; i++) {
      workers.push(downloadWorker(trackQueue));
    }
    
    // Wait for all workers to complete
    await Promise.all(workers);
    
    this.multiBar?.stop();
    
    // Results summary
    const t = i18n.t();
    console.log(chalk.green(`\n🎉 ${t.complete}`));
    console.log(chalk.green(`✅ ${completedTracks.length} tracks`));
    if (failedTracks.length > 0) {
      console.log(chalk.red(`❌ Failed: ${failedTracks.length} tracks`));
      failedTracks.forEach(title => console.log(chalk.red(`  • ${title}`)));
    }
    
    // Liberation messages
    console.log(chalk.bold.yellow(`\n${t.liberationMessages.afterDownload}`));
    console.log(chalk.bold.cyan(`${t.liberationMessages.artistSupport}`));
    console.log(chalk.bold.red(`${t.liberationMessages.bandcampMessage}`));
    console.log(chalk.bold.magenta(`\n${t.liberationMessages.zionistWarning}\n`));
  }

  /**
   * Advanced track download with progress and metadata
   */
  private async downloadTrackAdvanced(
    track: {
      title: string, 
      artist: string, 
      album: string,
      year: number | null,
      url: string, 
      filename: string,
      thumbnailUrl: string | null
    }, 
    progressBar: any, 
    downloadId: string
  ): Promise<void> {
    const config = this.config.getConfig();
    const outputPath = path.join(config.downloadOptions.outputDir, track.filename);
    
    try {
      progressBar?.update(5, { size: 'Connecting...' });
      const displayTitle = `${track.artist} - ${track.title}`;
      this.logger.info(chalk.cyan(`🔄 Starting: ${displayTitle}`));
      
      const { spawn } = require('child_process');
      
      // Download with yt-dlp and progress tracking - optimized for speed
      const downloadProcess = spawn('yt-dlp', [
        '-x', 
        '--audio-format', 'mp3',
        '--audio-quality', '320K',
        '--progress',
        '--newline',
        '--no-warnings',
        '--concurrent-fragments', '4', // Download fragments in parallel
        '--retries', '3',
        '--fragment-retries', '3',
        '--buffer-size', '16K',
        '--http-chunk-size', '10M',
        '-o', outputPath.replace('.mp3', '.%(ext)s'),
        track.url
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let downloadProgress = 0;
      let fileSize = 'Unknown';
      let errorOutput = '';
      
      downloadProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        
        // Parse yt-dlp progress
        if (output.includes('[download]')) {
          const progressMatch = output.match(/(\d+\.\d+)%/);
          const sizeMatch = output.match(/(\d+\.\d+\w+)/);
          
          if (progressMatch) {
            downloadProgress = Math.min(80, parseFloat(progressMatch[1]));
            progressBar?.update(downloadProgress, { 
              size: sizeMatch ? sizeMatch[1] : fileSize 
            });
          }
          
          if (sizeMatch) {
            fileSize = sizeMatch[1];
          }
        }
        
        // Check for completion
        if (output.includes('[ExtractAudio]') || output.includes('Deleting original file')) {
          progressBar?.update(85, { size: 'Converting...' });
        }
      });
      
      downloadProcess.stderr.on('data', (data: Buffer) => {
        const error = data.toString();
        errorOutput += error;
        
        // Log significant errors
        if (error.includes('ERROR') || error.includes('WARNING')) {
          this.logger.warn(chalk.yellow(`⚠️  ${track.artist} - ${track.title}: ${error.trim()}`));
        }
      });
      
      const downloadExitCode = await new Promise<number>((resolve) => {
        downloadProcess.on('close', (code: number) => {
          resolve(code);
        });
      });
      
      if (downloadExitCode !== 0) {
        throw new Error(`Download failed with code ${downloadExitCode}: ${errorOutput.trim()}`);
      }
      
      progressBar?.update(87, { size: 'Download complete, processing metadata...' });
      this.logger.info(chalk.green(`📥 Downloaded: ${track.artist} - ${track.title}, processing metadata...`));
      
      // Start parallel metadata processing with complete YouTube Music metadata
      const metadataPromise = this.processMetadataParallel({
        title: track.title,
        artist: track.artist,
        album: track.album,
        year: track.year,
        thumbnailUrl: track.thumbnailUrl
      }, outputPath);
      
      // Update progress while metadata processes
      progressBar?.update(90, { size: 'Searching for metadata...' });
      
      await metadataPromise;
      
      progressBar?.update(100, { size: 'Complete!' });
      
    } catch (error) {
      progressBar?.update(100, { size: 'Failed!' });
      this.logger.error(chalk.red(`❌ Download failed for ${track.artist} - ${track.title}: ${error}`));
      throw error;
    }
  }

  /**
   * Process metadata in parallel using YouTube Music data as source of truth
   */
  private async processMetadataParallel(track: {
    title: string, 
    artist: string,
    album?: string,
    year?: number | null,
    thumbnailUrl?: string | null
  }, outputPath: string): Promise<void> {
    try {
      this.logger.info(chalk.blue(`🏷️  Using YouTube Music metadata: ${track.artist} - ${track.title} (${track.album || 'N/A'}, ${track.year || 'N/A'})`));
      
      // YouTube Music metadata is our source of truth
      let coverArtUrl = track.thumbnailUrl || null;
      let enhancedMetadata = {
        artist: track.artist,
        title: track.title,
        album: track.album || 'Unknown Album',
        year: track.year || null,
        genre: null as string | null
      };
      
      // Try to get better cover art and additional metadata from external services
      try {
        this.logger.info(chalk.blue(`🔍 Enriching with Spotify metadata...`));
        const spotifyResult = await this.searchWithConfidenceCheck({
          artist: track.artist,
          title: track.title
        }, MusicSource.SPOTIFY);
        
        if (spotifyResult && spotifyResult.confidence > 0.8) {
          const spotifyTrack = spotifyResult.track;
          this.logger.info(chalk.green(`🎵 Spotify match (${Math.round(spotifyResult.confidence * 100)}%): ${spotifyTrack.artist} - ${spotifyTrack.title}`));
          
          // Get high-quality cover art from Spotify
          if (spotifyTrack.album) {
            // Try to get cover art URL from Spotify track
            const spotifyCoverUrl = await this.getCoverArtUrl(spotifyTrack, MusicSource.SPOTIFY);
            if (spotifyCoverUrl) {
              coverArtUrl = spotifyCoverUrl;
              this.logger.info(chalk.green(`🖼️  Using Spotify cover art`));
            }
          }
          
          // Add genre if available
          if (spotifyTrack.genre) {
            enhancedMetadata.genre = Array.isArray(spotifyTrack.genre) ? 
              spotifyTrack.genre[0] : spotifyTrack.genre;
          }
        }
      } catch (error) {
        this.logger.warn(chalk.yellow(`⚠️  Spotify enrichment failed: ${error.message}`));
      }
      
      // Try Deezer as fallback for cover art if we still don't have one
      if (!coverArtUrl || coverArtUrl.includes('i.ytimg.com')) {
        try {
          this.logger.info(chalk.blue(`🔍 Searching Deezer for cover art...`));
          const deezerResult = await this.searchWithConfidenceCheck({
            artist: track.artist,
            title: track.title
          }, MusicSource.DEEZER);
          
          if (deezerResult && deezerResult.confidence > 0.8) {
            const deezerCoverUrl = await this.getCoverArtUrl(deezerResult.track, MusicSource.DEEZER);
            if (deezerCoverUrl) {
              coverArtUrl = deezerCoverUrl;
              this.logger.info(chalk.green(`🖼️  Using Deezer cover art`));
            }
          }
        } catch (error) {
          this.logger.warn(chalk.yellow(`⚠️  Deezer search failed: ${error.message}`));
        }
      }
      
      // Apply metadata to file
      const finalPath = outputPath.replace(/\.[^.]+$/, '.mp3');
      if (fs.existsSync(finalPath)) {
        await this.applyEnrichedMetadata(finalPath, enhancedMetadata, coverArtUrl);
      } else {
        this.logger.warn(chalk.yellow(`⚠️  File not found for metadata application: ${finalPath}`));
      }
      
    } catch (error) {
      this.logger.warn(chalk.yellow(`⚠️  Metadata processing failed: ${error}`));
    }
  }

  /**
   * Apply enriched metadata to file
   */
  private async applyEnrichedMetadata(
    filePath: string,
    metadata: {
      artist: string,
      title: string,
      album: string,
      year: number | null,
      genre: string | null
    },
    coverArtUrl: string | null
  ): Promise<void> {
    try {
      const NodeID3 = require('node-id3');
      
      const tags: any = {
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album
      };
      
      // Add year if available
      if (metadata.year && metadata.year > 1950 && metadata.year <= new Date().getFullYear()) {
        tags.year = metadata.year.toString();
      }
      
      // Add genre if available
      if (metadata.genre && metadata.genre !== 'Unknown') {
        tags.genre = metadata.genre;
      }
      
      // Download and embed cover art
      if (coverArtUrl) {
        this.logger.info(chalk.blue(`🖼️  Downloading cover art for: ${metadata.artist} - ${metadata.title}`));
        const coverArtBuffer = await this.downloadCoverArt(coverArtUrl);
        if (coverArtBuffer) {
          tags.image = {
            mime: 'image/jpeg',
            type: {
              id: 3,
              name: 'Front cover'
            },
            description: 'Cover Art',
            imageBuffer: coverArtBuffer
          };
          this.logger.info(chalk.green(`🖼️  Cover art embedded: ${metadata.artist} - ${metadata.title}`));
        }
      }
      
      NodeID3.write(tags, filePath);
      this.logger.info(chalk.green(`✅ Complete metadata: ${metadata.artist} - ${metadata.title} (${metadata.album}, ${metadata.year || 'N/A'})`));
      
    } catch (error) {
      this.logger.warn(chalk.yellow(`⚠️  Failed to apply metadata: ${error}`));
    }
  }

  /**
   * Process metadata in parallel while other downloads continue (old version for updates)
   */
  private async processMetadataParallelOld(track: {title: string, artist?: string}, outputPath: string): Promise<void> {
    try {
      // Parse original title to extract artist and song
      const originalParsed = this.parseTrackTitle(track.title);
      
      // If we already have artist info from playlist, use it
      if (track.artist && track.artist !== 'Unknown Artist') {
        originalParsed.artist = track.artist;
      }
      
      this.logger.info(chalk.blue(`🔍 Searching metadata for: ${originalParsed.artist} - ${originalParsed.title}`));
      
      // Try multiple sources for metadata with strict matching
      let enhancedTrack = null;
      let coverArtUrl = null;
      let matchConfidence = 0;
      
      // Try Spotify first
      try {
        const spotifyResult = await this.searchWithConfidenceCheck(originalParsed, MusicSource.SPOTIFY);
        if (spotifyResult && spotifyResult.confidence > matchConfidence) {
          enhancedTrack = spotifyResult.track;
          coverArtUrl = await this.getCoverArtUrl(enhancedTrack, MusicSource.SPOTIFY);
          matchConfidence = spotifyResult.confidence;
          this.logger.info(chalk.green(`🎵 Spotify: Found ${enhancedTrack.artist} - ${enhancedTrack.title} (confidence: ${Math.round(spotifyResult.confidence * 100)}%)`));
        }
      } catch (error) {
        this.logger.warn(chalk.yellow(`⚠️  Spotify search failed: ${error.message}`));
      }
      
      // Try Deezer if confidence is not high enough
      if (matchConfidence < 0.8) {
        try {
          const deezerResult = await this.searchWithConfidenceCheck(originalParsed, MusicSource.DEEZER);
          if (deezerResult && deezerResult.confidence > matchConfidence) {
            enhancedTrack = deezerResult.track;
            coverArtUrl = await this.getCoverArtUrl(enhancedTrack, MusicSource.DEEZER);
            matchConfidence = deezerResult.confidence;
            this.logger.info(chalk.green(`🎵 Deezer: Found ${enhancedTrack.artist} - ${enhancedTrack.title} (confidence: ${Math.round(deezerResult.confidence * 100)}%)`));
          }
        } catch (error) {
          this.logger.warn(chalk.yellow(`⚠️  Deezer search failed: ${error.message}`));
        }
      }
      
      // Only use YouTube as fallback for cover art if we have a good match
      if (enhancedTrack && matchConfidence >= 0.7 && !coverArtUrl) {
        try {
          const ytTrack = await this.searchYouTubeMetadata(`${enhancedTrack.artist} ${enhancedTrack.title}`);
          if (ytTrack) {
            coverArtUrl = (ytTrack as any).thumbnail;
            this.logger.info(chalk.blue(`🖼️  YouTube: Found cover art for ${enhancedTrack.artist} - ${enhancedTrack.title}`));
          }
        } catch (error) {
          this.logger.warn(chalk.yellow(`⚠️  YouTube cover art search failed: ${error.message}`));
        }
      }
      
      // Apply metadata only if confidence is high enough
      const finalPath = outputPath.replace(/\.[^.]+$/, '.mp3');
      if (fs.existsSync(finalPath)) {
        if (matchConfidence >= 0.7) {
          await this.applyMetadataToFile(finalPath, enhancedTrack, track.title, coverArtUrl);
        } else {
          this.logger.warn(chalk.yellow(`⚠️  Low confidence match (${Math.round(matchConfidence * 100)}%) - keeping original metadata for: ${track.title}`));
          // Apply minimal metadata with original info
          await this.applyMinimalMetadata(finalPath, originalParsed, track.title);
        }
      } else {
        this.logger.warn(chalk.yellow(`⚠️  File not found for metadata application: ${finalPath}`));
      }
      
    } catch (error) {
      this.logger.warn(chalk.yellow(`⚠️  Metadata processing failed for ${track.title}: ${error}`));
    }
  }

  /**
   * Parse YouTube Music title format which often includes artist info
   */
  private parseYouTubeMusicTitle(title: string, uploader: string = ''): {artist: string, title: string, originalTitle: string} {
    const originalTitle = title;
    
    // Clean the title first
    let cleanTitle = title
      .replace(/\([^)]*official[^)]*\)/gi, '') // Remove (Official Video/Audio)
      .replace(/\[[^\]]*official[^\]]*\]/gi, '') // Remove [Official Video/Audio]
      .replace(/\([^)]*video[^)]*\)/gi, '') // Remove (Video)
      .replace(/\([^)]*audio[^)]*\)/gi, '') // Remove (Audio)
      .replace(/\([^)]*lyrics[^)]*\)/gi, '') // Remove (Lyrics)
      .replace(/\([^)]*remaster[^)]*\)/gi, '') // Remove (Remastered)
      .replace(/\([^)]*\d{4}[^)]*\)/g, '') // Remove (2023) etc
      .trim();
    
    // Try to detect artist - song pattern
    let artist = '';
    let songTitle = cleanTitle;
    
    // Pattern: "Artist - Song"
    if (cleanTitle.includes(' - ')) {
      const parts = cleanTitle.split(' - ');
      if (parts.length === 2) {
        artist = parts[0].trim();
        songTitle = parts[1].trim();
      }
    }
    // Pattern: "Artist: Song"
    else if (cleanTitle.includes(': ')) {
      const parts = cleanTitle.split(': ');
      if (parts.length === 2) {
        artist = parts[0].trim();
        songTitle = parts[1].trim();
      }
    }
    // Pattern: "Artist | Song"
    else if (cleanTitle.includes(' | ')) {
      const parts = cleanTitle.split(' | ');
      if (parts.length === 2) {
        artist = parts[0].trim();
        songTitle = parts[1].trim();
      }
    }
    // If no artist found in title but uploader exists, use uploader as artist
    else if (uploader && uploader !== 'YouTube Music' && uploader !== 'Various Artists' && uploader !== 'Unknown') {
      artist = uploader.trim();
      songTitle = cleanTitle;
    }
    
    return {
      artist: artist || 'Unknown Artist',
      title: songTitle || cleanTitle,
      originalTitle
    };
  }

  /**
   * Parse track title to extract artist and song name (original function)
   */
  private parseTrackTitle(title: string): {artist: string, title: string, originalTitle: string} {
    const originalTitle = title;
    
    // Clean the title first
    let cleanTitle = title
      .replace(/\([^)]*official[^)]*\)/gi, '') // Remove (Official Video/Audio)
      .replace(/\[[^\]]*official[^\]]*\]/gi, '') // Remove [Official Video/Audio]
      .replace(/\([^)]*video[^)]*\)/gi, '') // Remove (Video)
      .replace(/\([^)]*audio[^)]*\)/gi, '') // Remove (Audio)
      .replace(/\([^)]*lyrics[^)]*\)/gi, '') // Remove (Lyrics)
      .replace(/\([^)]*remaster[^)]*\)/gi, '') // Remove (Remastered)
      .replace(/\([^)]*\d{4}[^)]*\)/g, '') // Remove (2023) etc
      .trim();
    
    // Try to detect artist - song pattern
    let artist = '';
    let songTitle = cleanTitle;
    
    // Pattern: "Artist - Song"
    if (cleanTitle.includes(' - ')) {
      const parts = cleanTitle.split(' - ');
      if (parts.length === 2) {
        artist = parts[0].trim();
        songTitle = parts[1].trim();
      }
    }
    // Pattern: "Artist: Song"
    else if (cleanTitle.includes(': ')) {
      const parts = cleanTitle.split(': ');
      if (parts.length === 2) {
        artist = parts[0].trim();
        songTitle = parts[1].trim();
      }
    }
    // Pattern: "Artist | Song"
    else if (cleanTitle.includes(' | ')) {
      const parts = cleanTitle.split(' | ');
      if (parts.length === 2) {
        artist = parts[0].trim();
        songTitle = parts[1].trim();
      }
    }
    
    return {
      artist: artist || 'Unknown Artist',
      title: songTitle || cleanTitle,
      originalTitle
    };
  }

  /**
   * Search with confidence checking for exact matches
   */
  private async searchWithConfidenceCheck(
    originalParsed: {artist: string, title: string}, 
    source: MusicSource
  ): Promise<{track: Track, confidence: number} | null> {
    try {
      const searchQuery = `${originalParsed.artist} ${originalParsed.title}`;
      const enhancedTrack = await this.metadataService.enhanceTrackMetadata({
        title: searchQuery,
        artist: '',
        album: '',
        source: source
      } as Track);
      
      if (!enhancedTrack || !enhancedTrack.artist || !enhancedTrack.title) {
        return null;
      }
      
      // Calculate confidence based on string similarity
      const confidence = this.calculateMatchConfidence(originalParsed, enhancedTrack);
      
      return { track: enhancedTrack, confidence };
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate match confidence between original and found track
   */
  private calculateMatchConfidence(
    original: {artist: string, title: string}, 
    found: Track
  ): number {
    if (!found.artist || !found.title) return 0;
    
    // Normalize strings for comparison
    const normalizeString = (str: string) => 
      str.toLowerCase()
         .replace(/[^\w\s]/g, '')
         .replace(/\s+/g, ' ')
         .trim();
    
    const origArtist = normalizeString(original.artist);
    const origTitle = normalizeString(original.title);
    const foundArtist = normalizeString(found.artist);
    const foundTitle = normalizeString(found.title);
    
    // Exact match gets highest score
    if (origArtist === foundArtist && origTitle === foundTitle) {
      return 1.0;
    }
    
    // Artist must match closely for underground music
    const artistSimilarity = this.stringSimilarity(origArtist, foundArtist);
    const titleSimilarity = this.stringSimilarity(origTitle, foundTitle);
    
    // For underground music, artist match is crucial
    if (artistSimilarity < 0.8) {
      return 0; // Reject if artist doesn't match well
    }
    
    // Both artist and title must be good matches
    const combinedScore = (artistSimilarity * 0.6) + (titleSimilarity * 0.4);
    
    // Additional penalty if lengths are very different (indicates wrong match)
    const lengthDiff = Math.abs(origTitle.length - foundTitle.length) / Math.max(origTitle.length, foundTitle.length);
    if (lengthDiff > 0.5) {
      return combinedScore * 0.7;
    }
    
    return combinedScore;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private stringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0;
    
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (matrix[str2.length][str1.length] / maxLength);
  }

  /**
   * Apply minimal metadata when no good match is found
   */
  private async applyMinimalMetadata(
    filePath: string, 
    originalParsed: {artist: string, title: string, originalTitle: string},
    originalTitle: string
  ): Promise<void> {
    try {
      const NodeID3 = require('node-id3');
      
      const tags: any = {
        title: originalParsed.title !== 'Unknown Artist' ? originalParsed.title : originalTitle,
        artist: originalParsed.artist !== 'Unknown Artist' ? originalParsed.artist : 'Unknown Artist',
        album: 'Unknown Album'
      };
      
      NodeID3.write(tags, filePath);
      this.logger.info(chalk.blue(`🏷️  Applied minimal ID3 tags: ${tags.artist} - ${tags.title}`));
      
    } catch (error) {
      this.logger.warn(chalk.yellow(`⚠️  Failed to apply minimal metadata: ${error}`));
    }
  }  /**
   * Get cover art URL from enhanced track metadata
   */
  private async getCoverArtUrl(track: Track, source: MusicSource): Promise<string | null> {
    // This would need to be implemented based on the APIs
    // For now, return null - we'll improve this
    return null;
  }

  /**
   * Search YouTube for metadata
   */
  private async searchYouTubeMetadata(query: string): Promise<Track | null> {
    try {
      const { spawn } = require('child_process');
      
      // Use yt-dlp to get metadata
      const ytdlp = spawn('yt-dlp', [
        '--print', '%(title)s|%(uploader)s|%(album)s|%(thumbnail)s',
        '--no-download',
        `ytsearch1:"${query}"`
      ]);
      
      let output = '';
      ytdlp.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });
      
      await new Promise((resolve) => {
        ytdlp.on('close', resolve);
      });
      
      if (output.trim()) {
        const [title, artist, album, thumbnail] = output.trim().split('|');
        return {
          title: title || query,
          artist: artist || 'Unknown Artist',
          album: album || 'Unknown Album',
          source: MusicSource.YOUTUBE,
          thumbnail: thumbnail
        } as Track & { thumbnail: string };
      }
    } catch (error) {
      // Silent fail
    }
    
    return null;
  }

  /**
   * Apply metadata and cover art to file
   */
  private async applyMetadataToFile(
    filePath: string, 
    enhancedTrack: Track | null, 
    originalTitle: string,
    coverArtUrl: string | null
  ): Promise<void> {
    try {
      const NodeID3 = require('node-id3');
      
      // Parse original title to get fallback info
      const originalParsed = this.parseTrackTitle(originalTitle);
      
      const tags: any = {
        title: enhancedTrack?.title || originalParsed.title,
        artist: enhancedTrack?.artist || originalParsed.artist,
        album: enhancedTrack?.album || 'Unknown Album'
      };
      
      // Add year if available and seems reasonable
      if (enhancedTrack?.year && enhancedTrack.year > 1950 && enhancedTrack.year <= new Date().getFullYear()) {
        tags.year = enhancedTrack.year.toString();
      }
      
      // Add genre if available
      if (enhancedTrack?.genre) {
        const genreValue = Array.isArray(enhancedTrack.genre) ? 
          enhancedTrack.genre[0] : enhancedTrack.genre;
        if (genreValue && genreValue !== 'Unknown') {
          tags.genre = genreValue;
        }
      }
      
      // Download and embed cover art only if we have a confident match
      if (coverArtUrl && enhancedTrack) {
        this.logger.info(chalk.blue(`🖼️  Downloading cover art for: ${tags.artist} - ${tags.title}`));
        const coverArtBuffer = await this.downloadCoverArt(coverArtUrl);
        if (coverArtBuffer) {
          tags.image = {
            mime: 'image/jpeg',
            type: {
              id: 3,
              name: 'Front cover'
            },
            description: 'Cover Art',
            imageBuffer: coverArtBuffer
          };
          this.logger.info(chalk.green(`🖼️  Cover art embedded: ${tags.artist} - ${tags.title}`));
        }
      }
      
      NodeID3.write(tags, filePath);
      this.logger.info(chalk.green(`🏷️  Applied ID3 tags: ${tags.artist} - ${tags.title}`));
      
    } catch (error) {
      this.logger.warn(chalk.yellow(`⚠️  Failed to apply metadata: ${error}`));
    }
  }

  /**
   * Fix metadata for existing files
   */
  private async fixMetadataMode(): Promise<void> {
    const { directory } = await inquirer.prompt([
      {
        type: 'input',
        name: 'directory',
        message: 'Enter directory path (or press Enter for default download directory):',
        default: this.config.getDownloadDir()
      }
    ]);

    const spinner = ora('Scanning for MP3 files...').start();
    
    try {
      const files = await this.scanMusicFiles(directory);
      spinner.succeed(`Found ${files.length} MP3 files`);

      if (files.length === 0) {
        console.log(chalk.yellow('No MP3 files found'));
        return;
      }

      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `Fix metadata for ${files.length} files?`,
          default: true
        }
      ]);

      if (!proceed) return;

      let fixed = 0;
      let failed = 0;

      for (const file of files) {
        try {
          console.log(chalk.cyan(`🔍 Processing: ${path.basename(file)}`));
          
          // Parse filename to get artist and title
          const parsed = this.parseFilename(file);
          
          if (parsed.artist && parsed.title) {
            // Search MusicBrainz
            const mbTrack = await this.musicBrainzService.searchRecording(parsed.artist, parsed.title);
            
            if (mbTrack) {
              await this.applyEnrichedMetadata(file, {
                artist: mbTrack.artist,
                title: mbTrack.title,
                album: mbTrack.album || 'Unknown Album',
                year: mbTrack.year || null,
                genre: mbTrack.genres?.[0] || null
              }, mbTrack.coverArtUrl || null);
              
              fixed++;
              console.log(chalk.green(`✅ Fixed: ${parsed.artist} - ${parsed.title}`));
            } else {
              console.log(chalk.yellow(`⚠️  No metadata found for: ${parsed.artist} - ${parsed.title}`));
              failed++;
            }
          } else {
            console.log(chalk.yellow(`⚠️  Could not parse: ${path.basename(file)}`));
            failed++;
          }
        } catch (error) {
          failed++;
          console.log(chalk.red(`❌ Error: ${path.basename(file)}`));
        }
      }

      console.log(chalk.green(`\n✅ Fixed ${fixed} files`));
      if (failed > 0) {
        console.log(chalk.yellow(`⚠️  Failed/Skipped ${failed} files`));
      }

    } catch (error) {
      spinner.fail('Error scanning directory');
      this.logger.error(`Error: ${error}`);
    }
  }

  /**
   * Add cover art to existing files
   */
  private async addCoverArtMode(): Promise<void> {
    const { directory } = await inquirer.prompt([
      {
        type: 'input',
        name: 'directory',
        message: 'Enter directory path (or press Enter for default download directory):',
        default: this.config.getDownloadDir()
      }
    ]);

    const spinner = ora('Scanning for MP3 files...').start();
    
    try {
      const files = await this.scanMusicFiles(directory);
      spinner.succeed(`Found ${files.length} MP3 files`);

      if (files.length === 0) {
        console.log(chalk.yellow('No MP3 files found'));
        return;
      }

      // Filter files without cover art
      const filesNeedingCover: string[] = [];
      for (const file of files) {
        const check = await this.checkMetadataCompleteness(file);
        if (!check.hasCoverArt) {
          filesNeedingCover.push(file);
        }
      }

      console.log(chalk.blue(`📊 ${filesNeedingCover.length} files missing cover art`));

      if (filesNeedingCover.length === 0) {
        console.log(chalk.green('All files already have cover art!'));
        return;
      }

      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `Add cover art to ${filesNeedingCover.length} files?`,
          default: true
        }
      ]);

      if (!proceed) return;

      let added = 0;
      let failed = 0;

      for (const file of filesNeedingCover) {
        try {
          console.log(chalk.cyan(`🖼️  Processing: ${path.basename(file)}`));
          
          // Read existing metadata
          const NodeID3 = require('node-id3');
          const tags = NodeID3.read(file);
          
          if (tags && tags.artist && tags.title) {
            // Search for cover art
            const coverResult = await this.coverArtService.searchCoverArt(
              tags.artist,
              tags.title,
              tags.album
            );
            
            if (coverResult) {
              const coverBuffer = await this.coverArtService.downloadCoverArt(coverResult.url);
              
              if (coverBuffer) {
                tags.image = {
                  mime: 'image/jpeg',
                  type: {
                    id: 3,
                    name: 'Front cover'
                  },
                  description: 'Cover Art',
                  imageBuffer: coverBuffer
                };
                
                NodeID3.write(tags, file);
                added++;
                console.log(chalk.green(`✅ Added cover from ${coverResult.source}: ${tags.artist} - ${tags.title}`));
              }
            } else {
              console.log(chalk.yellow(`⚠️  No cover found for: ${tags.artist} - ${tags.title}`));
              failed++;
            }
          } else {
            console.log(chalk.yellow(`⚠️  No metadata in: ${path.basename(file)}`));
            failed++;
          }
        } catch (error) {
          failed++;
          console.log(chalk.red(`❌ Error: ${path.basename(file)}`));
        }
      }

      console.log(chalk.green(`\n✅ Added cover art to ${added} files`));
      if (failed > 0) {
        console.log(chalk.yellow(`⚠️  Failed/Skipped ${failed} files`));
      }

    } catch (error) {
      spinner.fail('Error scanning directory');
      this.logger.error(`Error: ${error}`);
    }
  }

  /**
   * Add lyrics to existing files
   */
  private async addLyricsMode(): Promise<void> {
    const { directory } = await inquirer.prompt([
      {
        type: 'input',
        name: 'directory',
        message: 'Enter directory path (or press Enter for default download directory):',
        default: this.config.getDownloadDir()
      }
    ]);

    const spinner = ora('Scanning for MP3 files...').start();
    
    try {
      const files = await this.scanMusicFiles(directory);
      spinner.succeed(`Found ${files.length} MP3 files`);

      if (files.length === 0) {
        console.log(chalk.yellow('No MP3 files found'));
        return;
      }

      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `Search and add lyrics to ${files.length} files?`,
          default: true
        }
      ]);

      if (!proceed) return;

      let added = 0;
      let failed = 0;

      for (const file of files) {
        try {
          console.log(chalk.cyan(`📝 Processing: ${path.basename(file)}`));
          
          // Read existing metadata
          const NodeID3 = require('node-id3');
          const tags = NodeID3.read(file);
          
          // Check if lyrics already exist
          if (tags && tags.unsynchronisedLyrics && tags.unsynchronisedLyrics.text) {
            console.log(chalk.blue(`ℹ️  Already has lyrics: ${path.basename(file)}`));
            continue;
          }
          
          if (tags && tags.artist && tags.title) {
            // Search for lyrics
            const lyricsResult = await this.lyricsService.searchLyrics(tags.artist, tags.title);
            
            if (lyricsResult && lyricsResult.lyrics) {
              await this.lyricsService.embedLyrics(file, lyricsResult.lyrics);
              added++;
              console.log(chalk.green(`✅ Added lyrics from ${lyricsResult.source}: ${tags.artist} - ${tags.title}`));
            } else {
              console.log(chalk.yellow(`⚠️  No lyrics found for: ${tags.artist} - ${tags.title}`));
              failed++;
            }
          } else {
            console.log(chalk.yellow(`⚠️  No metadata in: ${path.basename(file)}`));
            failed++;
          }
        } catch (error) {
          failed++;
          console.log(chalk.red(`❌ Error: ${path.basename(file)}`));
        }
      }

      console.log(chalk.green(`\n✅ Added lyrics to ${added} files`));
      if (failed > 0) {
        console.log(chalk.yellow(`⚠️  Failed/Skipped ${failed} files`));
      }

    } catch (error) {
      spinner.fail('Error scanning directory');
      this.logger.error(`Error: ${error}`);
    }
  }

  /**
   * Batch process existing files (metadata + cover art + lyrics)
   */
  private async batchProcessMode(): Promise<void> {
    const { directory } = await inquirer.prompt([
      {
        type: 'input',
        name: 'directory',
        message: 'Enter directory path (or press Enter for default download directory):',
        default: this.config.getDownloadDir()
      }
    ]);

    const { operations } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'operations',
        message: 'Select operations to perform:',
        choices: [
          { name: '🏷️  Fix metadata', value: 'metadata', checked: true },
          { name: '🖼️  Add cover art', value: 'covers', checked: true },
          { name: '📝 Add lyrics', value: 'lyrics', checked: true }
        ],
        validate: input => input.length > 0 || 'Select at least one operation'
      }
    ]);

    const spinner = ora('Scanning for MP3 files...').start();
    
    try {
      const files = await this.scanMusicFiles(directory);
      spinner.succeed(`Found ${files.length} MP3 files`);

      if (files.length === 0) {
        console.log(chalk.yellow('No MP3 files found'));
        return;
      }

      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `Process ${files.length} files?`,
          default: true
        }
      ]);

      if (!proceed) return;

      let processed = 0;
      let failed = 0;

      for (const file of files) {
        try {
          console.log(chalk.cyan(`\n🔄 Processing: ${path.basename(file)}`));
          
          const NodeID3 = require('node-id3');
          let tags = NodeID3.read(file);
          
          // Parse filename if no metadata
          if (!tags || !tags.artist || !tags.title) {
            const parsed = this.parseFilename(file);
            if (!parsed.artist || !parsed.title) {
              console.log(chalk.yellow(`⚠️  Cannot process: ${path.basename(file)}`));
              failed++;
              continue;
            }
            tags = { artist: parsed.artist, title: parsed.title };
          }

          let updated = false;

          // Fix metadata
          if (operations.includes('metadata')) {
            const mbTrack = await this.musicBrainzService.searchRecording(tags.artist, tags.title);
            if (mbTrack) {
              tags.artist = mbTrack.artist;
              tags.title = mbTrack.title;
              tags.album = mbTrack.album || tags.album;
              if (mbTrack.year) tags.year = mbTrack.year.toString();
              if (mbTrack.genres && mbTrack.genres.length > 0) tags.genre = mbTrack.genres[0];
              updated = true;
              console.log(chalk.green(`  ✅ Updated metadata`));
            }
          }

          // Add cover art
          if (operations.includes('covers') && (!tags.image || !tags.image.imageBuffer)) {
            const coverResult = await this.coverArtService.searchCoverArt(
              tags.artist,
              tags.title,
              tags.album
            );
            
            if (coverResult) {
              const coverBuffer = await this.coverArtService.downloadCoverArt(coverResult.url);
              if (coverBuffer) {
                tags.image = {
                  mime: 'image/jpeg',
                  type: { id: 3, name: 'Front cover' },
                  description: 'Cover Art',
                  imageBuffer: coverBuffer
                };
                updated = true;
                console.log(chalk.green(`  ✅ Added cover art from ${coverResult.source}`));
              }
            }
          }

          // Add lyrics
          if (operations.includes('lyrics') && (!tags.unsynchronisedLyrics || !tags.unsynchronisedLyrics.text)) {
            const lyricsResult = await this.lyricsService.searchLyrics(tags.artist, tags.title);
            if (lyricsResult && lyricsResult.lyrics) {
              tags.unsynchronisedLyrics = {
                language: 'eng',
                shortText: 'Lyrics',
                text: lyricsResult.lyrics
              };
              updated = true;
              console.log(chalk.green(`  ✅ Added lyrics from ${lyricsResult.source}`));
            }
          }

          if (updated) {
            NodeID3.write(tags, file);
            processed++;
            console.log(chalk.green(`✅ Completed: ${tags.artist} - ${tags.title}`));
          } else {
            console.log(chalk.blue(`ℹ️  No updates needed: ${path.basename(file)}`));
          }

        } catch (error) {
          failed++;
          console.log(chalk.red(`❌ Error: ${path.basename(file)} - ${error}`));
        }
      }

      console.log(chalk.green(`\n✅ Processed ${processed} files`));
      if (failed > 0) {
        console.log(chalk.yellow(`⚠️  Failed/Skipped ${failed} files`));
      }

    } catch (error) {
      spinner.fail('Error scanning directory');
      this.logger.error(`Error: ${error}`);
    }
  }

  /**
   * Scan directory for music files
   */
  private async scanMusicFiles(directory: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.mp3', '.flac', '.m4a', '.ogg'];

    const scanDir = async (dir: string) => {
      const items = await fs.readdir(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await scanDir(fullPath);
        } else if (extensions.includes(path.extname(fullPath).toLowerCase())) {
          files.push(fullPath);
        }
      }
    };

    await scanDir(directory);
    return files;
  }

  /**
   * Parse filename to extract artist and title
   */
  private parseFilename(filePath: string): { artist: string, title: string } {
    const filename = path.basename(filePath, path.extname(filePath));
    
    // Try common patterns: "Artist - Title", "Artist_Title", "Title by Artist"
    if (filename.includes(' - ')) {
      const [artist, title] = filename.split(' - ');
      return { artist: artist.trim(), title: title.trim() };
    }
    
    if (filename.includes('_')) {
      const [artist, title] = filename.split('_');
      return { artist: artist.trim(), title: title.trim() };
    }
    
    if (filename.toLowerCase().includes(' by ')) {
      const parts = filename.split(/ by /i);
      return { artist: parts[1]?.trim() || '', title: parts[0]?.trim() || '' };
    }
    
    // Fallback: whole filename as title
    return { artist: 'Unknown Artist', title: filename };
  }

  /**
   * Interactive configuration
   */
  private async interactiveConfig(): Promise<void> {
    const currentConfig = this.config.getConfig();
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'outputDir',
        message: 'Download directory:',
        default: currentConfig.downloadOptions.outputDir
      },
      {
        type: 'list',
        name: 'quality',
        message: 'Audio quality:',
        choices: ['96k', '192k', '320k', 'flac'],
        default: currentConfig.downloadOptions.quality
      },
      {
        type: 'list',
        name: 'format',
        message: 'Audio format:',
        choices: ['mp3', 'flac', 'm4a', 'ogg'],
        default: currentConfig.downloadOptions.format
      }
    ]);

    this.config.updateConfig({
      downloadOptions: {
        ...currentConfig.downloadOptions,
        ...answers
      }
    });

    console.log(chalk.green('Configuration updated!'));
  }
}

// CLI setup
const program = new Command();
const app = new YTMusicDownloader();

program
  .name('ytmusic-dl')
  .description('Multi-source music downloader with YouTube Music, Spotify, Deezer, and Tidal support')
  .version('1.0.0');

program
  .command('search <query>')
  .description('Search and download tracks')
  .action(async (query) => {
    const tracks = await app.searchTracks(query);
    
    if (tracks.length === 0) {
      console.log(chalk.red('No tracks found'));
      return;
    }

    // Auto-download first result
    const result = await app.downloadTrack(tracks[0]);
    if (result.success) {
      console.log(chalk.green(`✅ Downloaded: ${tracks[0].title}`));
    } else {
      console.log(chalk.red(`❌ Failed: ${result.error}`));
    }
  });

program
  .command('interactive')
  .alias('i')
  .description('Run in interactive mode')
  .action(async () => {
    await app.interactiveMode();
  });

// Default to interactive mode if no command provided
if (process.argv.length <= 2) {
  app.interactiveMode().catch(console.error);
} else {
  program.parse();
}

export default YTMusicDownloader;