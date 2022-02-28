import {Hash} from '@aws-sdk/hash-node';
import {S3RequestPresigner} from '@aws-sdk/s3-request-presigner';
import {Request, Response} from '@google-cloud/functions-framework';
import {OpdsFetcher} from 'opds-fetcher-parser';
import {AuthenticationStorage, http} from 'ts-fetch';
import {credentials} from './constant';
import {Controller} from './controller';
import validator from 'validator';
import * as dotenv from 'dotenv';

if (process.env['NODE_ENV'] === 'development') {
  dotenv.config();
}

export const fn = async (
  req: Request,
  res: Response,
  controller: Controller
) => {
  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).json({});
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({status: 'error', message: 'undefined method'});
    return;
  }

  const id = req.params.id;
  const cred = credentials[id];
  if (!cred) {
    res.status(401).json({status: 'error', message: 'unauthorized'});
    return;
  }

  const s3ManifestUrl = req.params.url;
  console.log('S3 manifest url:', s3ManifestUrl);
  if (
    !s3ManifestUrl ||
    !validator.isURL(s3ManifestUrl, {
      protocols: ['https'], // @TODO do not work why ?
    })
  ) {
    // @todo checks if it is a valid s3 url with the specific bucket
    res.status(400).json({status: 'error', message: 'bad request'});
    return;
  }

  const accessToken = (req.headers.authorization || '')
    .replace(/\s/g, '')
    .replace('BEARER', '')
    .replace('Bearer', '')
    .replace('bearer', '');

  controller.setupPresigner(cred);
  controller.setupHttpFetcher(accessToken, cred);

  const notAuthentified = await controller.isNotAuthentified(cred);
  if (notAuthentified) {
    res.status(401).json({status: 'error', message: 'unauthorized'});
    return;
  }

  // start algo
  // crawling manifest, update it, and send it

  const manifest = await controller.start(s3ManifestUrl);
  res.status(200).json(manifest); // @todo set content type webpub json
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
  try {
    res.set('Access-Control-Allow-Origin', '*');

    const controller = new Controller();
    return await fn(req, res, controller);
  } catch (e) {
    console.log(e);

    res.status(500).json({status: 'error', message: `${e}`});
  }
};
