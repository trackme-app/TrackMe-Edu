import logger, { createServiceLogger, createTraceLogger } from '../src/logger';

describe('Logger Utility', () => {
    describe('Default Logger', () => {
        it('should be defined', () => {
            expect(logger).toBeDefined();
        });

        it('should have the correct log level from environment or default to info', () => {
            // Since LOG_LEVEL is not set in test environment, it should default to info
            expect(logger.level).toBe('info');
        });
    });

    describe('createServiceLogger', () => {
        it('should create a child logger with the specified service name', () => {
            const serviceName = 'test-service';
            const childLogger = createServiceLogger(serviceName);

            expect(childLogger).toBeDefined();
            // @ts-ignore - accessing internal bindings for verification
            expect(childLogger.bindings()).toEqual({ service_name: serviceName });
        });
    });

    describe('createTraceLogger', () => {
        it('should create a child logger with the specified trace ID', () => {
            const traceId = 'test-trace-id';
            const childLogger = createTraceLogger(traceId);

            expect(childLogger).toBeDefined();
            // @ts-ignore - accessing internal bindings for verification
            expect(childLogger.bindings()).toEqual({ trace_id: traceId });
        });
    });
});
