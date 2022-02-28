import {Request, Response} from '@google-cloud/functions-framework';

const fn = async (req: Request, res: Response) => {
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

  try {
    return await fn(req, res);
  } catch (e) {
    console.log(e);

    res.status(500).json({status: 'error', message: `${e}`});
  }
};
