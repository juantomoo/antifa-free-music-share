import { LogLevel, LoggerConfig } from '../types';
import chalk from 'chalk';

export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;

  private constructor() {
    this.config = {
      level: LogLevel.INFO,
      enableFile: true,
      fileSize: '10MB',
      maxFiles: 5
    };
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLogLevel = levels.indexOf(level);
    return messageLogLevel >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    let formatted = `[${timestamp}] ${levelStr} ${message}`;
    
    if (data) {
      if (typeof data === 'object') {
        formatted += '\n' + JSON.stringify(data, null, 2);
      } else {
        formatted += ` ${data}`;
      }
    }
    
    return formatted;
  }

  private getColoredMessage(level: LogLevel, message: string): string {
    switch (level) {
      case LogLevel.DEBUG:
        return chalk.gray(message);
      case LogLevel.INFO:
        return chalk.blue(message);
      case LogLevel.WARN:
        return chalk.yellow(message);
      case LogLevel.ERROR:
        return chalk.red(message);
      default:
        return message;
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formatted = this.formatMessage(LogLevel.DEBUG, message, data);
      console.log(this.getColoredMessage(LogLevel.DEBUG, formatted));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const formatted = this.formatMessage(LogLevel.INFO, message, data);
      console.log(this.getColoredMessage(LogLevel.INFO, formatted));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const formatted = this.formatMessage(LogLevel.WARN, message, data);
      console.warn(this.getColoredMessage(LogLevel.WARN, formatted));
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formatted = this.formatMessage(LogLevel.ERROR, message, error);
      console.error(this.getColoredMessage(LogLevel.ERROR, formatted));
      
      if (error instanceof Error && error.stack) {
        console.error(chalk.red(error.stack));
      }
    }
  }

  success(message: string, data?: any): void {
    const formatted = this.formatMessage(LogLevel.INFO, message, data);
    console.log(chalk.green(formatted));
  }

  progress(message: string): void {
    process.stdout.write(`\r${chalk.cyan(message)}`);
  }

  clearProgress(): void {
    process.stdout.write('\r' + ' '.repeat(80) + '\r');
  }

  // Legacy methods for compatibility
  log(message: string): void {
    this.info(message);
  }
}

export default Logger;