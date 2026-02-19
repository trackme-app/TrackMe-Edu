import fs from "fs";
import https from "https";
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import axiosRetry from "axios-retry";
import { RequestContext } from "./context";

export interface SslConfig {
    key: string;
    cert: string;
    ca: string;
}

export abstract class BaseClient {
    protected axiosInstance: AxiosInstance;
    protected baseUrl: string;

    constructor(baseUrl: string, sslConfig?: SslConfig) {
        this.baseUrl = baseUrl;

        const httpsAgent = sslConfig ? new https.Agent({
            key: fs.readFileSync(sslConfig.key),
            cert: fs.readFileSync(sslConfig.cert),
            ca: fs.readFileSync(sslConfig.ca),
            rejectUnauthorized: true
        }) : undefined;

        this.axiosInstance = axios.create({
            validateStatus: () => true,
            httpsAgent: httpsAgent
        });

        axiosRetry(this.axiosInstance, {
            retries: 3,
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: (error) => axiosRetry.isNetworkError(error),
        });

        this.axiosInstance.interceptors.request.use((axiosConfig: InternalAxiosRequestConfig) => {
            const context = RequestContext.getStore();
            if (context && context.req && context.req.headers.cookie) {
                axiosConfig.headers.Cookie = context.req.headers.cookie;
            }
            return axiosConfig;
        });

        this.axiosInstance.interceptors.response.use((response: AxiosResponse) => {
            const context = RequestContext.getStore();
            if (context && context.res) {
                const cookies = response.headers['set-cookie'];
                if (cookies) {
                    context.res.setHeader('Set-Cookie', cookies);
                }
            }
            return response;
        });
    }

    protected handleError(error: any, serviceName: string, context: string) {
        if (error && error.statusCode && error.message) {
            throw error;
        }

        if (axios.isAxiosError(error) && error.response) {
            throw {
                message: error.response.data?.error || error.response.data?.message || error.message,
                statusCode: error.response.status
            };
        }

        throw {
            message: error.message || "Internal Service Communication Error",
            statusCode: 500
        };
    }
}