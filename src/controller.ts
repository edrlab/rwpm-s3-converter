import {S3RequestPresigner} from '@aws-sdk/s3-request-presigner';
import {OpdsFetcher} from 'opds-fetcher-parser';
import {http} from 'ts-fetch';

export class Controller {
  private http: http;
  private fetcher: OpdsFetcher;
  private S3RequestPresigner: S3RequestPresigner;

  constructor(
    _http: http,
    _fetcher: OpdsFetcher,
    _S3RequestPresigner: S3RequestPresigner
  ) {
    this.http = _http;
    this.fetcher = _fetcher;
    this.S3RequestPresigner = _S3RequestPresigner;
  }
}
