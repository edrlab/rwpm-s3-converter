import * as Sinon from 'sinon';
import * as httpMocks from 'node-mocks-http';
import {fn} from '../src';

// export const fetcherMocked = (feed?: Partial<IOpdsResultView>, webpub?: Partial<IWebPubView>) => {
//   const fetcher = Sinon.createStubInstance(OpdsFetcher, {
//     // @ts-ignore
//     feedRequest: sinon.stub().returns(Promise.resolve(feed)),
//     // @ts-ignore
//     webpubRequest: sinon.stub().returns(Promise.resolve(webpub)),
//   });

//   return fetcher;
// };

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
