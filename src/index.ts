import {Request, Response} from '@google-cloud/functions-framework';
import {credentials} from './credentials';
import {Controller} from './controller';
import validator from 'validator';
export const fn = async (
  req: Request,
  res: Response,
  controller: Controller
) => {
  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).json({});
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({status: 'error', message: 'undefined method'});
    return;
  }

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  console.log('ID=', id);

  const cred = credentials[id];
  if (!cred) {
    res.status(401).json({status: 'error', message: 'unauthorized'});
    return;
  }

  const s3ManifestUrl = typeof req.query.url === 'string' ? req.query.url : '';
  console.log('URL=', s3ManifestUrl);
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

  const accessToken =
    req.headers.authorization?.replace(/(bearer|\s)/gi, '') || '';

  controller.setupPresigner(cred);
  controller.setupHttpFetcher(accessToken);

  const notAuthentified = await controller.isNotAuthentified(cred);
  if (notAuthentified) {
    res.status(401).json({status: 'error', message: 'unauthorized'});
    return;
  } else {
    console.log('AUTHENTIFIED');
  }

  // start algo
  // crawling manifest, update it, and send it

  const manifest = await controller.start(s3ManifestUrl);
  res.status(200).contentType('application/webpub+json').json(manifest);
};

/**
 * HTTP Cloud Function.
 *
 * @param {Object} req Cloud Function request context.
 *                     More info: https://expressjs.com/en/api.html#req
 * @param {Object} res Cloud Function response context.
 *                     More info: https://expressjs.com/en/api.html#res
 */
export const manifest = async (req: Request, res: Response) => {
  try {
    res.set('Access-Control-Allow-Origin', '*');

    console.log('==> Start request from', req.hostname);

    const controller = new Controller();
    return await fn(req, res, controller);
  } catch (e) {
    console.log(e);

    res.status(500).json({status: 'error', message: `${e}`});
  }
};
