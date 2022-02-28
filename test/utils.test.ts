import * as Sinon from 'sinon';
import * as httpMocks from 'node-mocks-http';
import {fn} from '../src';
import {IOpdsResultView} from 'opds-fetcher-parser/build/src/interface/opds';
import {IWebPubView} from 'opds-fetcher-parser/build/src/interface/webpub';
import {OpdsFetcher} from 'opds-fetcher-parser';
import {http} from 'ts-fetch';
import {S3RequestPresigner} from '@aws-sdk/s3-request-presigner';
import {
  IHttpGetResult,
  THttpGetResultAfterCallback,
} from 'ts-fetch/build/src/http.type';

export const s3PresignedMocked = (url: string) => {
  const presign = Sinon.createStubInstance(S3RequestPresigner, {
    // @ts-ignore
    presign: Sinon.stub().returns(Promise.resolve(url)),
  });
  return presign;
};

export const httpMocked = (res: IHttpGetResult<any>) => {
  const getStubs = Sinon.stub();
  const _http = Sinon.createStubInstance(http, {
    // @ts-ignore
    get: getStubs.returns(Promise.resolve(getStubs.args[0][2](res))),
  });

  return _http;
};

export const fetcherMocked = (
  feed?: Partial<IOpdsResultView>,
  webpub?: Partial<IWebPubView>
) => {
  const fetcher = Sinon.createStubInstance(OpdsFetcher, {
    // @ts-ignore
    feedRequest: Sinon.stub().returns(Promise.resolve(feed)),
    // @ts-ignore
    webpubRequest: Sinon.stub().returns(Promise.resolve(webpub)),
  });

  return fetcher;
};

export const expressMocked = (
  params: httpMocks.Params,
  headers: httpMocks.Headers /*, webpub: Partial<IWebPubView> | undefined = undefined*/
) => {
  // const fetcher = fetcherMocked(feed, webpub) as unknown as OpdsFetcher;

  const req = httpMocks.createRequest({
    headers,
    method: 'GET',
    params,
  });

  const res = httpMocks.createResponse({
    eventEmitter: require('events').EventEmitter,
  });

  fn(req, res);
  const data = res._getJSONData();

  return [data, res.statusCode];
};
