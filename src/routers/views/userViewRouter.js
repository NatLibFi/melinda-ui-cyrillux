/*****************************************************************************/
/* MAIN VIEW ROUTER: ROUTES USER VIEW HTML                                   */
/*****************************************************************************/

/* External module imports */
import {Router} from 'express';


/*****************************************************************************/

export function createUserViewRouter() {
  return new Router()
    .get('/', renderUser);


  function renderUser(req, res) {
    const {user} = req.oidc;
    console.log(JSON.stringify(user));
    console.log(JSON.stringify(req.headers));

    const renderedView = 'user';
    const localVariable = {title: 'Käyttäjäprofiili | Cyrillux', user, username: user.id, location: {name: 'Käyttäjäprofiili', link: 'user'}};

    return res.render(renderedView, localVariable);
  }


}
