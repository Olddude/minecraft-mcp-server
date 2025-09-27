import { env } from 'node:process';
import log4js from 'log4js';
import type { Logger, LogLevel, LoggingConfig } from '@minecraft-mcp-server/types';

export const LOG_LEVELS = {
    TRACE: 'trace' as LogLevel,
    DEBUG: 'debug' as LogLevel,
    INFO: 'info' as LogLevel,
    WARN: 'warn' as LogLevel,
    ERROR: 'error' as LogLevel,
    FATAL: 'fatal' as LogLevel,
};

const DEFAULT_CONFIG: LoggingConfig = {
    level: LOG_LEVELS.DEBUG,
    enableConsole: true,
    enableFile: true,
    filePattern: 'logs/minecraft-mcp-server-%d{yyyy-MM-dd}.log',
    maxLogSize: '10M',
    backups: 5,
    compress: true,
};

function initializeLogging(): void {
    const loggingConfig: LoggingConfig = {
        ...DEFAULT_CONFIG,
        level: (env.LOG_LEVEL as LogLevel) || DEFAULT_CONFIG.level,
        enableConsole: env.LOG_CONSOLE !== 'false',
        enableFile: env.LOG_FILE !== 'false',
    };

    const appenders: Record<string, log4js.Appender> = {};
    const categories: Record<string, { appenders: string[]; level: string }> = {
        default: {
            appenders: [],
            level: loggingConfig.level,
        },
    };

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
            level: LOG_LEVELS.ERROR,
        };
    }

    log4js.configure({
        appenders,
        categories,
    });
}

export function getLogger(category: string = 'default'): Logger {
    return log4js.getLogger(category);
}

export function getErrorLogger(): Logger {
    return log4js.getLogger('error');
}

export function shutdownLogging(): Promise<void> {
    return new Promise((resolve) => {
        log4js.shutdown(() => {
            resolve();
        });
    });
}

initializeLogging();

export const logger = getLogger('minecraft-mcp-client');
