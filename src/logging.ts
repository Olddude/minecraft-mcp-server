import log4js from 'log4js';

/**
 * Logger interface for consistent logging across the application
 */
export interface Logger {
    trace(message: string, ...args: unknown[]): void;
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    fatal(message: string, ...args: unknown[]): void;
}

/**
 * Log levels supported by the application
 */
export enum LogLevel {
    TRACE = 'trace',
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    FATAL = 'fatal',
}

/**
 * Logging configuration
 */
interface LoggingConfig {
    level: LogLevel;
    enableConsole: boolean;
    enableFile: boolean;
    filePattern: string;
    maxLogSize: string;
    backups: number;
    compress: boolean;
}

/**
 * Default logging configuration
 */
const DEFAULT_CONFIG: LoggingConfig = {
    level: LogLevel.INFO,
    enableConsole: true,
    enableFile: true,
    filePattern: 'logs/minecraft-mcp-server-%d{yyyy-MM-dd}.log',
    maxLogSize: '10M',
    backups: 5,
    compress: true,
};

/**
 * Initialize the logging system
 */
function initializeLogging(): void {
    const loggingConfig: LoggingConfig = {
        ...DEFAULT_CONFIG,
        level: (process.env.LOG_LEVEL as LogLevel) || DEFAULT_CONFIG.level,
        enableConsole: process.env.LOG_CONSOLE !== 'false',
        enableFile: process.env.LOG_FILE !== 'false',
    };

    const appenders: Record<string, log4js.Appender> = {};
    const categories: Record<string, { appenders: string[]; level: string }> = {
        default: {
            appenders: [],
            level: loggingConfig.level,
        },
    };

    // Console appender
    if (loggingConfig.enableConsole) {
        appenders.console = {
            type: 'console',
            layout: {
                type: 'pattern',
                pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%p] %c - %m',
            },
        };
        categories.default.appenders.push('console');
    }

    // File appender
    if (loggingConfig.enableFile) {
        appenders.file = {
            type: 'dateFile',
            filename: loggingConfig.filePattern,
            pattern: 'yyyy-MM-dd',
            compress: loggingConfig.compress,
            maxLogSize: loggingConfig.maxLogSize,
            backups: loggingConfig.backups,
            layout: {
                type: 'pattern',
                pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%p] %c - %m%n',
            },
        };
        categories.default.appenders.push('file');
    }

    // Error file appender for errors and above
    if (loggingConfig.enableFile) {
        appenders.errorFile = {
            type: 'dateFile',
            filename: loggingConfig.filePattern.replace('.log', '-error.log'),
            pattern: 'yyyy-MM-dd',
            compress: loggingConfig.compress,
            maxLogSize: loggingConfig.maxLogSize,
            backups: loggingConfig.backups,
            layout: {
                type: 'pattern',
                pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%p] %c - %m%n%s',
            },
        };

        categories.error = {
            appenders: ['errorFile', ...(loggingConfig.enableConsole ? ['console'] : [])],
            level: LogLevel.ERROR,
        };
    }

    log4js.configure({
        appenders,
        categories,
    });
}

/**
 * Get a logger instance for a specific category
 */
export function getLogger(category: string = 'default'): Logger {
    return log4js.getLogger(category);
}

/**
 * Get an error logger that logs to both console and error file
 */
export function getErrorLogger(): Logger {
    return log4js.getLogger('error');
}

/**
 * Shutdown the logging system gracefully
 */
export function shutdownLogging(): Promise<void> {
    return new Promise((resolve) => {
        log4js.shutdown(() => {
            resolve();
        });
    });
}

// Initialize logging when module is loaded
initializeLogging();

// Export a default logger instance
export const logger = getLogger('minecraft-mcp-server');
