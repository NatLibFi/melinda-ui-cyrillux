import {createLogger} from '@natlibfi/melinda-backend-commons';
import {Error} from '@natlibfi/melinda-commons';
import httpStatus from 'http-status';


//*****************************************************************************
// Middleware for checking named route parameters
//*****************************************************************************
// - logs debug info for developer
// - checks app specific route parameters
// - if some named route parameters fail, next is called with http status '400 - Bad request'
//-----------------------------------------------------------------------------
//
export function handleFailedRouteParams(req, res, next) {

  const logger = createLogger();

  const routeParams = req.params;
  const route = req.baseUrl;

  logger.debug('.-._.-._.-._.-._.-._.-._.-._.-._.-._.-._.-._.-._.-._.-._');
  logger.debug(`Starting route parameter check for app...`);
  logger.verbose(`The current route is: ${route}`);
  logger.verbose(`All route parameters: ${JSON.stringify(routeParams)}`);

  const failedParams = [...checkCyrilluxRouteParams(routeParams)]
    .filter(param => !param.value)
    .map(param => param.name);

  if (failedParams.length === 0) {
    logger.debug(`Route parameter check for app passed!`);
    logger.debug('.-._.-._.-._.-._.-._.-._.-._.-._.-._.-._.-._.-._.-._.-._');
    return next();
  }

  logger.warn(`Failed route parameters: ${failedParams}`);
  const error = new Error(httpStatus.BAD_REQUEST, 'Invalid route parameter');
  return next(error);


  //*****************************************************************************
  // App specific checks for route parameters
  //-----------------------------------------------------------------------------
  //  - every function returns array of objects
  //       - objects have two properties: name and value
  //       - name is string (the route parameter name)
  //       - value is boolean (if the check is passed or not)
  //  - if route parameter is found in request (is defined), it is tested, and value is set true of false
  //  - otherwise check is automatically passed and value is set true
  //-----------------------------------------------------------------------------


  //-----------------------------------------------------------------------------
  // Checks Cyrilluxapp specific route parameters
  //  - possible Cyrillux route parameters is 'id'
  //  - parameter 'id' is not present in every request
  //
  function checkCyrilluxRouteParams(routeParams) {
    const {id} = routeParams;

    logger.verbose(id === undefined ? `No route parameter 'id'` : `Route parameter 'id' is ${id}`);

    return [{name: 'id', value: id ? /^[0-9]{1,9}$/u.test(id) : true}];
  }

}
