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

  it('should returns 404', () => {
    const [data, code] = expressMocked(params, header);

    code.should.to.be.eq(404);
    data.message.should.to.be.eq('not implemented yet');
  });
});
