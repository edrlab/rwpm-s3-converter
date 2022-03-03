import * as dotenv from 'dotenv';

export interface ICred {
  accessUrl: string;
  accessKeyId: string;
  secretAccessKeyId: string;
  regions: string;
}

if (process.env['NODE_ENV'] === 'development') {
  dotenv.config();
  console.log(process.env);
}

export const credentials: Record<string, ICred | undefined> = {
  [process.env['CELA_CLIENT_ID'] || 'cela']: {
    accessUrl: process.env['CELA_ACCESS_URL'] || '',
    accessKeyId: process.env['CELA_ACCESS_KEY_ID'] || '',
    secretAccessKeyId: process.env['CELA_SECRET_ACCESS_KEY_ID'] || '',
    regions: process.env['CELA_REGIONS'] || '',
  },
};

export const EXPIRE_IN_NUMBER = 60 * 60 * 24;
