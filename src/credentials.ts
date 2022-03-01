export interface ICred {
  accessUrl: string;
  accessKeyId: string;
  secretAccessKeyId: string;
  regions: string;
}

export const credentials: Record<string, ICred | undefined> = {
  [process.env['CELA_CLIENT_ID'] || 'cela']: {
    accessUrl: process.env['CELA_ACCESS_URL'] || '',
    accessKeyId: process.env['CELA_ACCESS_KEY_ID'] || '',
    secretAccessKeyId: process.env['CELA_SECRET_ACCESS_KEY_ID'] || '',
    regions: process.env['CELA_REGIONS'] || '',
  },
};
