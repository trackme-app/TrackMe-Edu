interface Config {
    port: number;
    ssl?: {
        key: string;
        cert: string;
        ca: string;
    };
}

const config: Config = {
    port: Number(process.env.PORT) || 3000,
    ssl: process.env.SSL_KEY_PATH ? {
        key: process.env.SSL_KEY_PATH,
        cert: process.env.SSL_CERT_PATH || "",
        ca: process.env.SSL_CA_PATH || ""
    } : undefined
};

export default config;
