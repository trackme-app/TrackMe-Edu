import pino from "pino";

const targets = [];

if (process.env.LOGTAIL_SOURCE_TOKEN && process.env.LOGTAIL_ENDPOINT) {
    targets.push({
        target: "@logtail/pino",
        options: {
            sourceToken: process.env.LOGTAIL_SOURCE_TOKEN,
            options: {
                endpoint: process.env.LOGTAIL_ENDPOINT,
            }
        },
        level: process.env.LOG_LEVEL || "info"
    });
}

if (process.env.NODE_ENV !== "production") {
    targets.push({
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "SYS:dd-mm-yyyy HH:MM:ss",
        },
        level: process.env.LOG_LEVEL || "info"
    });
}

const transport = targets.length > 0 ? pino.transport({ targets }) : undefined;

const logger = pino(
    { level: process.env.LOG_LEVEL || "info" },
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
export const createTraceLogger = (traceId: string, logObject?: pino.Logger) => {
    if (logObject) {
        return logObject.child({ trace_id: traceId });
    }
    return logger.child({ trace_id: traceId });
};

export default logger;