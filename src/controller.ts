import {S3RequestPresigner} from '@aws-sdk/s3-request-presigner';
import {OpdsFetcher} from 'opds-fetcher-parser';
import {http} from 'ts-fetch';

export class Controller {
  private http: http | undefined;
  private fetcher: OpdsFetcher | undefined;
  private S3RequestPresigner: S3RequestPresigner | undefined;

  constructor(
    _http?: http,
    _fetcher?: OpdsFetcher,
    _S3RequestPresigner?: S3RequestPresigner
  ) {
    this.http = _http;
    this.fetcher = _fetcher;
    this.S3RequestPresigner = _S3RequestPresigner;
  }

  public setup(
    _http?: http,
    _fetcher?: OpdsFetcher,
    _S3RequestPresigner?: S3RequestPresigner
  ) {
    this.http = _http;
    this.fetcher = _fetcher;
    this.S3RequestPresigner = _S3RequestPresigner;
  }

  public async start(url: string) {
    console.log(
      'Start crawling manifest and then update it with presign mp3 url'
    );
  }
}
