import express, { Request, Response, NextFunction } from 'express';
import { logger } from '@tme/shared-shared_utils';

const app = express();

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'OK' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || 'Internal server error';

    logger.error(`Error: ${errorMessage}`);

    // Only return status code and error message, no stack traces
    res.status(statusCode).json({ error: errorMessage });
});

export default app;