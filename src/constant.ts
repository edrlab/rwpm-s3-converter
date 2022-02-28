export interface ICred {
  accessUrl: string;
  accessKeyId: string;
  secretAccessKeyId: string;
  regions: string;
}

export const credentials: Record<string, ICred | undefined> = {
  cela: {
    accessUrl: 'CELA_ACCESS_URL',
    accessKeyId: 'CELA_ACCESS_KEY_ID',
    secretAccessKeyId: 'CELA_SECRET_ACCESS_KEY_ID',
    regions: 'CELA_REGIONS',
  },
};
