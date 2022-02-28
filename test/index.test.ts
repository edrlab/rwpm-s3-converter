import {Headers, Params} from 'node-mocks-http';
import {expressMocked} from './utils.test';

import * as chai from 'chai';
chai.should();

let params: Params = {};
let header: Headers = {};

describe('manifest cloud function', async () => {
  beforeEach(() => {
    params = {};
    header = {};
  });

  // it('should returns 404', () => {
  //   const [data, code] = expressMocked(params, header);

  //   code.should.to.be.eq(404);
  //   data.message.should.to.be.eq('not implemented yet');
  // });

  it('bad bearerToken', () => {
    const [data, code] = expressMocked(params, header);

    code.should.to.be.eq(401);
    data.message.should.to.be.eq('unauthorized');
    data.status.should.to.be.eq('error');
  });
  it('bad bearerToken with param', () => {
    params.test = 'hello';
    const [data, code] = expressMocked(params, header);

    code.should.to.be.eq(401);
    data.message.should.to.be.eq('unauthorized');
    data.status.should.to.be.eq('error');
  });
  it('bad bearerToken with param', () => {
    params.test = 'hello';
    header.authorization = 'BEARER bad';
    const [data, code] = expressMocked(params, header);

    code.should.to.be.eq(401);
    data.message.should.to.be.eq('unauthorized');
    data.status.should.to.be.eq('error');
  });
  it('good bearer - bad params', () => {
    params.test = 'hello';
    header.authorization = 'BEARER good';
    const [data, code] = expressMocked(params, header);

    code.should.to.be.eq(400);
    data.message.should.to.be.eq('bad request');
    data.status.should.to.be.eq('error');
  });
  it('good bearer - bad params', () => {
    params.id = 'cela'; // good
    header.authorization = 'BEARER good';
    const [data, code] = expressMocked(params, header);

    code.should.to.be.eq(400);
    data.message.should.to.be.eq('bad request');
    data.status.should.to.be.eq('error');
  });
  it('good bearer - bad params', () => {
    params.id = 'cela'; // good
    params.url = 'not an url';
    header.authorization = 'BEARER good';
    const [data, code] = expressMocked(params, header);

    code.should.to.be.eq(400);
    data.message.should.to.be.eq('bad request');
    data.status.should.to.be.eq('error');
  });
  it('good bearer - bad params', () => {
    params.id = 'bad'; // good
    params.url = 'http://my.url';
    header.authorization = 'BEARER good';
    const [data, code] = expressMocked(params, header);

    code.should.to.be.eq(400);
    data.message.should.to.be.eq('bad request');
    data.status.should.to.be.eq('error');
  });
  it('request manifest', () => {
    params.id = 'cela'; // good
    params.url = 'http://my.url';
    header.authorization = 'BEARER good';
    const [data, code] = expressMocked(params, header);

    code.should.to.be.eq(200);
  });
});
