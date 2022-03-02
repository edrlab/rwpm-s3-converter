import {Headers, Params} from 'node-mocks-http';
import {expressMocked} from './utils.test';

import * as chai from 'chai';
import {Response} from 'node-fetch';
import Sinon = require('sinon');
import {webpub} from './webpub.test';
import {IWebpub} from '../src/service';
chai.should();

let params: Params = {};
let header: Headers = {};

export let ___sandbox: any;
describe('manifest cloud function', async () => {
  beforeEach(() => {
    params = {};
    header = {};
    ___sandbox = Sinon.createSandbox();
  });

  afterEach(() => {
    ___sandbox.restore();
  });

  // it('should returns 404', () => {
  //   const [data, code] = expressMocked(params, header);

  //   code.should.to.be.eq(404);
  //   data.message.should.to.be.eq('not implemented yet');
  // });

  it('bad bearerToken', async () => {
    const [data, code] = await expressMocked(params, header);

    code.should.to.be.eq(401);
    data.message.should.to.be.eq('unauthorized');
    data.status.should.to.be.eq('error');
  });
  it('bad bearerToken with param', async () => {
    params.test = 'hello';
    const [data, code] = await expressMocked(params, header);

    code.should.to.be.eq(401);
    data.message.should.to.be.eq('unauthorized');
    data.status.should.to.be.eq('error');
  });
  it('bad bearerToken with param', async () => {
    params.test = 'hello';
    header.authorization = 'BEARER bad';
    const [data, code] = await expressMocked(params, header);

    code.should.to.be.eq(401);
    data.message.should.to.be.eq('unauthorized');
    data.status.should.to.be.eq('error');
  });
  it('good bearer - bad params', async () => {
    params.test = 'hello';
    header.authorization = 'BEARER good';
    const [data, code] = await expressMocked(params, header);

    code.should.to.be.eq(401);
    data.message.should.to.be.eq('unauthorized'); // id unknown
    data.status.should.to.be.eq('error');
  });
  it('good bearer - bad params', async () => {
    params.id = 'cela'; // good
    header.authorization = 'BEARER good';
    const [data, code] = await expressMocked(params, header);

    code.should.to.be.eq(400);
    data.message.should.to.be.eq('bad request');
    data.status.should.to.be.eq('error');
  });
  it('good bearer - bad params', async () => {
    params.id = 'cela'; // good
    params.url = 'not an url';
    header.authorization = 'BEARER token';
    const [data, code] = await expressMocked(params, header);

    code.should.to.be.eq(400);
    data.message.should.to.be.eq('bad request');
    data.status.should.to.be.eq('error');
  });
  it('good bearer - bad params', async () => {
    params.id = 'bad'; // bad id so unauthorized
    params.url = 'https://my.url';
    header.authorization = 'BEARER good';
    const [data, code] = await expressMocked(params, header);

    code.should.to.be.eq(401);
    data.message.should.to.be.eq('unauthorized');
    data.status.should.to.be.eq('error');
  });
  it('request manifest', async () => {
    params.id = 'cela'; // good
    params.url = 'https://s3.manifest.aws.com';
    header.authorization = 'BEARER good';
    // @ts-ignore

    let i = 0;
    const [data, code] = (await expressMocked(
      params,
      header,
      new Response(webpub, {status: 200}),
      () => (i++, 'https://presigned.rl/' + i.toString())
    )) as [IWebpub, number];

    console.log(data);

    (data as any).metadata.should.to.deep.equal(JSON.parse(webpub).metadata);
    data.readingOrder.should.to.be.an('array');
    data.resources?.should.to.be.an('array');
    data.toc?.should.to.be.an('array');
    data.readingOrder.map(({href, ...t}, i) => {
      const u = new URL(href);
      u.pathname.should.to.be.eq('/' + (i + 2));
      u.host.should.to.be.eq('presigned.rl');
      const l = JSON.parse(webpub).readingOrder[i];
      delete l.href;
      t.should.to.deep.eq(l);
    });
    data.toc?.map(({href, ...t}, i) => {
      const u = new URL(href);
      u.pathname.should.to.be.eq('/' + (i + 2));
      u.host.should.to.be.eq('presigned.rl');
      const l = JSON.parse(webpub).toc[i];
      delete l.href;
      t.should.to.deep.eq(l);
    });
    data.resources?.map(({href, ...t}, i) => {
      const u = new URL(href);
      u.pathname.should.to.be.eq('/' + (i + 2));
      u.host.should.to.be.eq('presigned.rl');
      const l = JSON.parse(webpub).resources[i];
      delete l.href;
      t.should.to.deep.eq(l);
    });
    code.should.to.be.eq(200);
  });
});
