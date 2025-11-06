export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  url: string;
  source: MusicSource;
  thumbnailUrl?: string;
  genre?: string[];
  year?: number;
  trackNumber?: number;
  isrc?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  tracks: Track[];
  source: MusicSource;
  url: string;
  thumbnailUrl?: string;
  owner?: string;
  totalTracks: number;
}

export interface DownloadOptions {
  outputDir: string;
  quality: AudioQuality;
  format: AudioFormat;
  addMetadata: boolean;
  addCoverArt: boolean;
  createPlaylistFolder: boolean;
  skipExisting: boolean;
  maxConcurrent: number;
}

export interface SearchResult {
  tracks: Track[];
  playlists: Playlist[];
  source: MusicSource;
}

export interface DownloadResult {
  track: Track;
  filePath?: string;
  success: boolean;
  error?: string;
  source: MusicSource;
}

export interface MetadataInfo {
  title: string;
  artist: string;
  album?: string;
  year?: number;
  genre?: string[];
  trackNumber?: number;
  coverArt?: Buffer;
  duration?: number;
  isrc?: string;
}

export interface ScrapingOptions {
  timeout: number;
  retries: number;
  userAgent?: string;
  headless: boolean;
  waitForSelector?: string;
  delay?: number;
}

export interface APICredentials {
  spotify?: {
    clientId: string;
    clientSecret: string;
  };
  deezer?: {
    appId: string;
    secret: string;
  };
  tidal?: {
    token: string;
    countryCode?: string;
  };
  youtube?: {
    apiKey?: string;
  };
}

export interface AppConfig {
  downloadOptions: DownloadOptions;
  apiCredentials: APICredentials;
  scrapingOptions: ScrapingOptions;
  sources: MusicSource[];
  fallbackToScraping: boolean;
  maxSearchResults: number;
  searchTimeout: number;
}

export enum MusicSource {
  YOUTUBE_MUSIC = 'youtube_music',
  YOUTUBE = 'youtube',
  SPOTIFY = 'spotify',
  DEEZER = 'deezer',
  TIDAL = 'tidal',
  SOUNDCLOUD = 'soundcloud',
  BANDCAMP = 'bandcamp'
}

export enum AudioQuality {
  LOW = '96k',
  MEDIUM = '192k', 
  HIGH = '320k',
  LOSSLESS = 'flac'
}

export enum AudioFormat {
  MP3 = 'mp3',
  FLAC = 'flac',
  M4A = 'm4a',
  OGG = 'ogg',
  WAV = 'wav'
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LoggerConfig {
  level: LogLevel;
  enableFile: boolean;
  fileSize: string;
  maxFiles: number;
}

export interface SourceCapability {
  canSearch: boolean;
  canDownload: boolean;
  needsAuth: boolean;
  supportsPlaylists: boolean;
  supportsMetadata: boolean;
  rateLimited: boolean;
  maxConcurrent: number;
}

export interface SourceConfig {
  [MusicSource.YOUTUBE_MUSIC]: SourceCapability;
  [MusicSource.YOUTUBE]: SourceCapability;
  [MusicSource.SPOTIFY]: SourceCapability;
  [MusicSource.DEEZER]: SourceCapability;
  [MusicSource.TIDAL]: SourceCapability;
  [MusicSource.SOUNDCLOUD]: SourceCapability;
  [MusicSource.BANDCAMP]: SourceCapability;
}

export interface DownloadProgress {
  trackIndex: number;
  totalTracks: number;
  currentTrack: Track;
  percentage: number;
  speed?: string;
  eta?: string;
  status: 'downloading' | 'processing' | 'completed' | 'failed' | 'skipped';
}

// Legacy interfaces for compatibility
export interface Metadata {
  title: string;
  artist: string;
  album: string;
  coverArtUrl: string;
  duration: number; // duration in seconds
}

export interface Config {
  youtubeApiKey: string;
  spotifyApiKey: string;
  deezerApiKey: string;
  tidalApiKey: string;
  downloadPath: string; // path where audio files will be saved
}