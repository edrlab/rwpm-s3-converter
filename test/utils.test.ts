import * as Sinon from 'sinon';
import * as httpMocks from 'node-mocks-http';
import {fn} from '../src';
import {S3RequestPresigner} from '@aws-sdk/s3-request-presigner';
import {Controller} from '../src/controller';
import * as fetchModule from 'node-fetch';
import {Response} from 'node-fetch';
import {___sandbox} from './index.test';
import {HttpRequest} from '@aws-sdk/protocol-http';
import {parseUrl} from '@aws-sdk/url-parser';

export const s3PresignedMocked = (url = () => 'https://fake.url') => {
  const s = Sinon.stub();

  for (let i = 0; i < 100; i++) {
    s.onCall(i).returns(Promise.resolve(new HttpRequest(parseUrl(url()))));
  }
  const presign = Sinon.createStubInstance(S3RequestPresigner, {
    // @ts-ignore
    presign: s.returns(Promise.resolve(new HttpRequest(parseUrl(url())))),
  });
  return presign;
};

export const fetcherMocked = (res: Response) => {
  const stub = ___sandbox.stub(fetchModule, 'default');
  stub.returns(new Promise(resolve => resolve(res)));
};

export const expressMocked = async (
  query: httpMocks.Query,
  headers: httpMocks.Headers,
  httpRes: Response | undefined = undefined,
  url: (() => string) | undefined = undefined
) => {
  // const fetcher = fetcherMocked(feed, webpub) as unknown as OpdsFetcher;

  const req = httpMocks.createRequest({
    headers,
    method: 'GET',
    query,
  });

  const res = httpMocks.createResponse({
    eventEmitter: require('events').EventEmitter,
  });

  fetcherMocked(httpRes!);
  const fetcher = () => fetchModule.default;

  const presign = s3PresignedMocked(url!);
  const controller = new Controller(fetcher, presign);

  await fn(req, res, controller);
  const data = res._getJSONData();

  return [data, res.statusCode];
};
