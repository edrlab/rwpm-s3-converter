import {Hash} from '@aws-sdk/hash-node';
import {S3RequestPresigner} from '@aws-sdk/s3-request-presigner';
import {ok} from 'assert';
import {OpdsFetcher} from 'opds-fetcher-parser';
import {AuthenticationStorage, http} from 'ts-fetch';
import {ICred} from './credentials';

export class Controller {
  private http: http | undefined;
  private fetcher: OpdsFetcher | undefined;
  private presigner: S3RequestPresigner | undefined;

  constructor(
    _http?: http,
    _fetcher?: OpdsFetcher,
    _presigner?: S3RequestPresigner
  ) {
    this.http = _http;
    this.fetcher = _fetcher;
    this.presigner = _presigner;
  }

  public setup(
    _http?: http,
    _fetcher?: OpdsFetcher,
    _S3RequestPresigner?: S3RequestPresigner
  ) {
    this.http = _http;
    this.fetcher = _fetcher;
    this.presigner = _S3RequestPresigner;
  }

  public setupPresigner(cred: ICred) {
    if (this.presigner) {
      return;
    }

    const accessKeyId = cred.accessKeyId;
    const secretAccessKey = cred.secretAccessKeyId;
    const region = cred.regions;

    const presigner = new S3RequestPresigner({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
      sha256: Hash.bind(null, 'sha256'), // In Node.js
    });

    this.presigner = presigner;
  }

  public setupHttpFetcher(accessToken: string, cred: ICred) {
    if (this.fetcher || this.http) {
      return;
    }

    const authenticationUrl = cred.accessUrl;

    const authenticationStorage = new AuthenticationStorage();
    authenticationStorage.setAuthenticationToken({
      accessToken,
      authenticationUrl,
    });
    const requester = new http(undefined, authenticationStorage);
    const fetcher = new OpdsFetcher(requester);

    this.http = requester;
    this.fetcher = fetcher;
  }

  public async isNotAuthentified(cred: ICred) {
    ok(this.http);

    const authenticationUrl = cred.accessUrl;
    const res = await this.http.get(authenticationUrl);

    const notAuthentified = (res?.statusCode || 0) === 401;
    const isKo = res?.isFailure;

    return notAuthentified || isKo;
  }

  public async start(url: string): Promise<object> {
    console.log(
      'Start crawling manifest and then update it with presign mp3 url'
    );

    return {};
  }
}
