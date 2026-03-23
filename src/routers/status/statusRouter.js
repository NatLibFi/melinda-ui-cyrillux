/*****************************************************************************/
/* STATUS ROUTER: PING!                                                      */
/*****************************************************************************/

/* External module imports */
import {Router} from 'express';
import HttpStatus from 'http-status';


/*****************************************************************************/

export function createStatusRouter() {
  return new Router()
    .get('/', ping);

  function ping(req, res) {
    return res.status(HttpStatus.OK).end();
  }
}
