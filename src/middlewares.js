import {createLogger} from '@natlibfi/melinda-backend-commons';

/*****************************************************************************/
/* CUSTOM MIDDLEWARES FOR APP                                                */
/*****************************************************************************/

//---------------------------------------------------//
// Create loggers: use natlibfi middleware helpers
// appLogger is used for in-app (debug) logging

export const appLogger = createLogger();

//---------------------------------------------------//
// Middleware function to handle 404 pages

export function handlePageNotFound(req, res, next) {
  appLogger.warn(`Error: it seems that this page is not found!`);
  appLogger.verbose(`Request method: ${req.method} | Path: ${req.path} | Query parameters: ${JSON.stringify(req.query)}`);

  const renderedView = 'pageNotFound';
  const localVariable = {title: 'Sivua ei löydy', username: req.user?.displayName};

  res.status(404);
  res.render(renderedView, localVariable);
}


//---------------------------------------------------//
//Middleware function to handle errors

export function handleAppError(err, req, res, next) {
  appLogger.debug('APP: handleError');

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  const renderedView = 'error';
  const localVariable = {title: `Error | Cyrillux`};

  res.status(err.status || 500);
  res.render(renderedView, localVariable);
}
