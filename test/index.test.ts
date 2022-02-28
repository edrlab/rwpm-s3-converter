import {Body, Headers} from 'node-mocks-http';
import {expressMocked} from './utils.test';

import * as chai from 'chai';
chai.should();

let body: Body = {};
let header: Headers = {};

describe('manifest cloud function', async () => {
  beforeEach(() => {
    body = {};
    header = {};
  });

  it('should returns 404', () => {
    const [data, code] = expressMocked(body, header);

    code.should.to.be.eq(404);
    data.message.should.to.be.eq('not implemented yet');
  });
});
