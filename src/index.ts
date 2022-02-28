import {Hash} from '@aws-sdk/hash-node';
import {S3RequestPresigner} from '@aws-sdk/s3-request-presigner';
import {Request, Response} from '@google-cloud/functions-framework';
import {OpdsFetcher} from 'opds-fetcher-parser';
import {AuthenticationStorage, http} from 'ts-fetch';
import {Controller} from './controller';

export const fn = async (
  req: Request,
  res: Response,
  controller: Controller
) => {
  switch (req.method) {
    case 'GET':
      res.status(404).json({status: 'error', message: 'not implemented yet'});
      break;

    case 'OPTIONS':
      // Send response to OPTIONS requests
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '3600');
      res.status(204).json({});
      break;
    default:
      res.status(405).json({status: 'error', message: 'undefined method'});
      break;
  }
};

/**
 * HTTP Cloud Function.
 *
 * @param {Object} req Cloud Function request context.
 *                     More info: https://expressjs.com/en/api.html#req
 * @param {Object} res Cloud Function response context.
 *                     More info: https://expressjs.com/en/api.html#res
 */
exports.manifest = async (req: Request, res: Response) => {
  res.set('Access-Control-Allow-Origin', '*');

  const region = 'ca-central-1';

  const presigner = new S3RequestPresigner({
    credentials: {
      accessKeyId: '',
      secretAccessKey: '',
    },
    region,
    sha256: Hash.bind(null, 'sha256'), // In Node.js
  });

  const authenticationStorage = new AuthenticationStorage();
  authenticationStorage.setAuthenticationToken({
    accessToken: 'good',
    authenticationUrl: 'https://my.url',
  });
  const _http = new http(undefined, authenticationStorage);
  const fetcher = new OpdsFetcher(_http);
  const controller = new Controller(_http, fetcher, presigner);

  try {
    return await fn(req, res, controller);
  } catch (e) {
    console.log(e);

    res.status(500).json({status: 'error', message: `${e}`});
  }
};
