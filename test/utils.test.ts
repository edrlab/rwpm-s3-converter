import * as Sinon from 'sinon';
import * as httpMocks from 'node-mocks-http';
import {fn} from '../src';
import {IOpdsResultView} from 'opds-fetcher-parser/build/src/interface/opds';
import {IWebPubView} from 'opds-fetcher-parser/build/src/interface/webpub';
import {OpdsFetcher} from 'opds-fetcher-parser';
import {AuthenticationStorage, http} from 'ts-fetch';
import {S3RequestPresigner} from '@aws-sdk/s3-request-presigner';
import {IHttpGetResult} from 'ts-fetch/build/src/http.type';
import {Controller} from '../src/controller';

export const s3PresignedMocked = (url: string) => {
  const presign = Sinon.createStubInstance(S3RequestPresigner, {
    // @ts-ignore
    presign: Sinon.stub().returns(Promise.resolve(url)),
  });
  return presign;
};

export const httpMocked = (res: IHttpGetResult<any>) => {
  const auth = new AuthenticationStorage();
  auth.setAuthenticationToken({
    accessToken: 'token',
    authenticationUrl: 'http://my.url',
  });
  const _http = new http(undefined, auth);
  const getStub = Sinon.stub(_http, 'get').returns(Promise.resolve(res));
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

export const expressMocked = async (
  params: httpMocks.Params,
  headers: httpMocks.Headers,
  webpub: Partial<IWebPubView> | undefined = undefined,
  httpRes: IHttpGetResult<any> | undefined = undefined,
  url: string | undefined = undefined
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

  const fetcher = fetcherMocked(undefined, webpub);

  const http = httpMocked(httpRes!);
  const presign = s3PresignedMocked(url!);
  const controller = new Controller(http, fetcher, presign);

  await fn(req, res, controller);
  const data = res._getJSONData();

  return [data, res.statusCode];
};
