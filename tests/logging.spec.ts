import { getLogger, logger, getErrorLogger, LogLevel } from '@/src/logging';

describe('Logging Module', () => {
    beforeEach(() => {
        // Mock console methods to capture log output in tests
        jest.spyOn(console, 'info').mockImplementation(jest.fn());
        jest.spyOn(console, 'warn').mockImplementation(jest.fn());
        jest.spyOn(console, 'error').mockImplementation(jest.fn());
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getLogger', () => {
        it('should return a logger instance', () => {
            const testLogger = getLogger('test');
            expect(testLogger).toBeDefined();
            expect(typeof testLogger.info).toBe('function');
            expect(typeof testLogger.warn).toBe('function');
            expect(typeof testLogger.error).toBe('function');
            expect(typeof testLogger.debug).toBe('function');
            expect(typeof testLogger.trace).toBe('function');
            expect(typeof testLogger.fatal).toBe('function');
        });

        it('should return different instances for different categories', () => {
            const logger1 = getLogger('category1');
            const logger2 = getLogger('category2');
            expect(logger1).not.toBe(logger2);
        });
    });

    describe('default logger', () => {
        it('should be available as a default export', () => {
            expect(logger).toBeDefined();
            expect(typeof logger.info).toBe('function');
        });

        it('should log messages without throwing errors', () => {
            const logMessages = () => {
                logger.info('Test message');
                logger.warn('Test warning');
                logger.error('Test error');
            };
            expect(logMessages).not.toThrow();
        });
    });

    describe('getErrorLogger', () => {
        it('should return an error logger instance', () => {
            const errorLogger = getErrorLogger();
            expect(errorLogger).toBeDefined();
            expect(typeof errorLogger.error).toBe('function');
        });
    });

    describe('LogLevel enum', () => {
        it('should have all expected log levels', () => {
            expect(LogLevel.TRACE).toBe('trace');
            expect(LogLevel.DEBUG).toBe('debug');
            expect(LogLevel.INFO).toBe('info');
            expect(LogLevel.WARN).toBe('warn');
            expect(LogLevel.ERROR).toBe('error');
            expect(LogLevel.FATAL).toBe('fatal');
        });
    });

    describe('logger methods', () => {
        const testLogger = getLogger('test-logger');

        it('should handle logging with additional arguments', () => {
            expect(() => {
                testLogger.info('Message with data', { key: 'value' }, 123);
                testLogger.warn('Warning with array', [1, 2, 3]);
                testLogger.error('Error with object', new Error('test error'));
            }).not.toThrow();
        });

        it('should handle all log levels', () => {
            expect(() => {
                testLogger.trace('Trace message');
                testLogger.debug('Debug message');
                testLogger.info('Info message');
                testLogger.warn('Warn message');
                testLogger.error('Error message');
                testLogger.fatal('Fatal message');
            }).not.toThrow();
        });
    });
});
