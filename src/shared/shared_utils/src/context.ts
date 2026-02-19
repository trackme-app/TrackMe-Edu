import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response } from 'express';

export interface ContextData {
    req: Request;
    res: Response;
}

export const RequestContext = new AsyncLocalStorage<ContextData>();
