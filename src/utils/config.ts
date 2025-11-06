import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';
import { AppConfig, MusicSource, AudioQuality, AudioFormat, LogLevel } from '../types';

// Load environment variables
dotenvConfig();

export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;
  private configPath: string;

  private constructor() {
    this.configPath = join(process.cwd(), 'config', 'default.json');
    this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): void {
    try {
      if (!existsSync(this.configPath)) {
        this.createDefaultConfig();
      }
      
      const configData = JSON.parse(readFileSync(this.configPath, 'utf8'));
      this.config = this.validateConfig(configData);
    } catch (error) {
      console.error('Error loading config:', error);
      this.config = this.getDefaultConfig();
    }
  }

  private validateConfig(config: any): AppConfig {
    // Validate and merge with default config
    const defaultConfig = this.getDefaultConfig();
    
    return {
      downloadOptions: {
        ...defaultConfig.downloadOptions,
        ...config.downloadOptions
      },
      apiCredentials: {
        ...defaultConfig.apiCredentials,
        ...config.apiCredentials
      },
      scrapingOptions: {
        ...defaultConfig.scrapingOptions,
        ...config.scrapingOptions
      },
      sources: config.sources || defaultConfig.sources,
      fallbackToScraping: config.fallbackToScraping ?? defaultConfig.fallbackToScraping,
      maxSearchResults: config.maxSearchResults || defaultConfig.maxSearchResults,
      searchTimeout: config.searchTimeout || defaultConfig.searchTimeout
    };
  }

  private getDefaultConfig(): AppConfig {
    return {
      downloadOptions: {
        outputDir: process.env.DOWNLOAD_DIR || './downloads',
        quality: (process.env.AUDIO_QUALITY as AudioQuality) || AudioQuality.HIGH,
        format: (process.env.AUDIO_FORMAT as AudioFormat) || AudioFormat.MP3,
        addMetadata: true,
        addCoverArt: true,
        createPlaylistFolder: true,
        skipExisting: true,
        maxConcurrent: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || '5')
      },
      apiCredentials: {
        spotify: {
          clientId: process.env.SPOTIFY_CLIENT_ID || '',
          clientSecret: process.env.SPOTIFY_CLIENT_SECRET || ''
        },
        deezer: {
          appId: '',
          secret: ''
        },
        tidal: {
          token: '',
          countryCode: 'US'
        },
        youtube: {
          apiKey: ''
        }
      },
      scrapingOptions: {
        timeout: 30000,
        retries: 3,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        headless: true,
        delay: 1000
      },
      sources: [
        MusicSource.YOUTUBE_MUSIC,
        MusicSource.YOUTUBE,
        MusicSource.SPOTIFY,
        MusicSource.DEEZER,
        MusicSource.TIDAL
      ],
      fallbackToScraping: true,
      maxSearchResults: 10,
      searchTimeout: 15000
    };
  }

  private createDefaultConfig(): void {
    const configDir = join(process.cwd(), 'config');
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
    
    const defaultConfig = this.getDefaultConfig();
    writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  private saveConfig(): void {
    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  // Convenience methods
  getDownloadDir(): string {
    return this.config.downloadOptions.outputDir;
  }

  getApiCredentials() {
    return this.config.apiCredentials;
  }

  getScrapingOptions() {
    return this.config.scrapingOptions;
  }

  getSources(): MusicSource[] {
    return this.config.sources;
  }

  shouldFallbackToScraping(): boolean {
    return this.config.fallbackToScraping;
  }

  setApiCredential(service: keyof AppConfig['apiCredentials'], credentials: any): void {
    if (this.config.apiCredentials[service]) {
      this.config.apiCredentials[service] = { ...this.config.apiCredentials[service], ...credentials };
      this.saveConfig();
    }
  }
}