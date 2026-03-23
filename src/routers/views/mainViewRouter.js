/*****************************************************************************/
/* MAIN VIEW ROUTER: ROUTES APP ROOT AND HOME VIEW HTML                      */
/*****************************************************************************/

/* External module imports */
import {Router} from 'express';
import {authCheck, getAuthUserDisplayName} from '../rest/authRouter.js';


/*****************************************************************************/

export function createMainViewRouter(version = '', category = 'N/A') {
  const versionText = version === '' ? version : ` (v.${version})`;

  return new Router()
    .get('/', authCheck({failureRedirects: '/kirjautuminen'}), renderCyrillux)
    .get('/kirjautuminen', authCheck({successRedirects: '/', allowUnauthorized: true}), renderLogin)

  function renderCyrillux(req, res) {
    const renderedView = 'cyrillux';
    const displayName = getAuthUserDisplayName(req);
    const userid = req.user.id.replace(/([0-9]+|OLK)$/, ''); // Don't pass the full user id to the client side
    const localVariable = {title: `Cyrillux${versionText}`, libraryType: category, userid, username: displayName, onload: 'initialize()', version};

    return res.render(renderedView, localVariable);
  }

  function renderLogin(req, res) {
    const renderedView = 'loginpage';
    const localVariable = {title: `Cyrillux${versionText} | kirjautuminen`, isLogin: true, onload: 'initialize()', version};

    return res.render(renderedView, localVariable);
  }
}
