import fs from 'fs';
import https from 'https';
import app from './app';
import config from './config/config';
import { logger } from '@tme/shared-shared_utils';

if (config.ssl && config.ssl.key && config.ssl.cert) {
    const options = {
        key: fs.readFileSync(config.ssl.key),
        cert: fs.readFileSync(config.ssl.cert),
        ca: fs.readFileSync(config.ssl.ca),
        requestCert: true,
        rejectUnauthorized: true
    };

    https.createServer(options, app).listen(config.port, () => {
        logger.info(`HTTPS Server (mTLS) running on port ${config.port}`);
    });
} else {
    app.listen(config.port, () => {
        logger.info(`HTTP Server running on port ${config.port}`);
    });
}