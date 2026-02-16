import pino from 'pino';

const targets: pino.TransportTargetOptions[] = [];

// Logtail transport if token is available
if (process.env.LOGTAIL_SOURCE_TOKEN && process.env.LOGTAIL_ENDPOINT) {
    targets.push({
        target: "@logtail/pino",
        options: {
            sourceToken: process.env.LOGTAIL_SOURCE_TOKEN,
            options: { endpoint: process.env.LOGTAIL_ENDPOINT }
        },
    });
}

// Pretty print for local development (if not in production or if explicitly enabled)
if (process.env.NODE_ENV && process.env.NODE_ENV !== 'production' || process.env.ENABLE_PRETTY_LOGGING && process.env.ENABLE_PRETTY_LOGGING === 'true') {
    targets.push({
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "SYS:dd-mm-yyyy HH:MM:ss",
            ignore: "pid,hostname",
        },
    });
}

const transport = pino.transport({
    targets,
});

const logger = pino(
    {
        level: process.env.LOG_LEVEL || "info",
        timestamp: () => `,"dt":"${pino.stdTimeFunctions.isoTime()}"`
    },
    transport
);

/**
 * Creates a child logger with a service_name for the current service.
 * @param serviceName The name of the service.
 * @returns A pino child logger.
 */
export const createServiceLogger = (serviceName: string) => {
    return logger.child({ service_name: serviceName });
};

/**
 * Creates a child logger with a trace_id for distributed tracing.
 * @param traceId The unique identifier for the trace.
 * @returns A pino child logger.
 */
export const createTraceLogger = (traceId: string) => {
    return logger.child({ trace_id: traceId });
};

export default logger;
