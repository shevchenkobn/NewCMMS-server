import { Response } from 'express';
import { getExtension } from 'mime';
import { logger } from '../services/logger.service';

export function isPositiveInteger(num: number) {
  return Number.isSafeInteger(num) && num > 0;
}

export function deserializeResponseBody(res: Response, body: any) {
  if (typeof body !== 'string') {
    return body;
  }
  const type = getExtension(res.get('Content-Type').split(/;\s*/)[0]);
  switch (type) {
    case 'json':
      return JSON.parse(body);
    default:
      logger.warn(`Unexpected body type: ${type}. Returning string`);
      return body;
  }
}
