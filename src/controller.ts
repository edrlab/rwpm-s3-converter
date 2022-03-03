import {Hash} from '@aws-sdk/hash-node';
import {S3RequestPresigner} from '@aws-sdk/s3-request-presigner';
import {ok} from 'assert';
import fetch, {Headers, Response} from 'node-fetch';
import {ICred} from './credentials';
import {Service} from './service';

export type fetchRequest = (
  token?: boolean
) => (url: string) => Promise<Response>;

export class Controller {
  private fetcher: fetchRequest | undefined;
  private presigner: S3RequestPresigner | undefined;
  private service: Service;

  constructor(
    _fetcher?: fetchRequest,
    _presigner?: S3RequestPresigner,
    _service: Service = new Service()
  ) {
    this.fetcher = _fetcher;
    this.presigner = _presigner;
    this.service = _service;
  }

  public setup(
    _fetcher?: fetchRequest,
    _S3RequestPresigner?: S3RequestPresigner
  ) {
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

  public setupHttpFetcher(accessToken: string) {
    if (this.fetcher) {
      return;
    }

    this.fetcher = (token?: boolean) => {
      const headers = new Headers();
      if (token) {
        headers.set('Authorization', 'Bearer ' + accessToken);
      }
      return (url: string) => {
        return fetch(url, {
          headers,
          timeout: 60 * 5,
        });
      };
    };
  }

  public async isNotAuthentified(cred: ICred) {
    ok(this.fetcher);

    const authenticationUrl = cred.accessUrl;
    const res = await this.fetcher(true)(authenticationUrl);

    const notAuthentified = (res?.status || 0) === 401;
    const isKo = !res?.ok;

    return notAuthentified || isKo;
  }

  public async start(url: string): Promise<object> {
    console.log(
      'Start crawling manifest and then update it with presign mp3 url'
    );

    ok(this.fetcher);
    ok(this.presigner);

    this.service.setup(this.fetcher(false), this.presigner);

    const manifest = await this.service.start(url);
    return manifest;
  }
}
