import express from 'express';
import {engine} from 'express-handlebars';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';

import {AlephStrategy} from '@natlibfi/passport-melinda-aleph';
import {MelindaJwtStrategy, verify, cookieExtractor} from '@natlibfi/passport-melinda-jwt';

import {createExpressLogger} from '@natlibfi/melinda-backend-commons';
import {createAuthRouter, createMainViewRouter, createRecordRouter, createStatusRouter} from './routers/routers.js';
import {appLogger, handleAppError, handlePageNotFound} from './middlewares.js';


/*****************************************************************************/
/* START THE APP                                                             */
/*****************************************************************************/

//////////////////////////////////////////////////////////////////
// The function startApp creates server and returns it.
// The parameter is a set of environment variables

export async function startApp(configOptions) {

  const {httpPort, enableProxy, melindaApiOptions, sharedLocationOptions, sruApiOptions, authAlephOptions, authJwtOptions, version} = configOptions;

  const server = await initExpress();

  return server;

  //////////////////////////////////////////////////////////////////


  //----------------------------------------------------//
  // Defining the Express server

  // Add async when you need await in route construction

  async function initExpress() {
    //---------------------------------------------------//
    // Set the application as an Express app (function)

    const app = express();
    app.enable('trust proxy', Boolean(enableProxy));

    //---------------------------------------------------//
    // enable cors

    app.use(cors());

    //---------------------------------------------------//
    // enable cookie parser

    app.use(cookieParser());

    //---------------------------------------------------//
    // configure passport strategies for authentication

    //login via auth header with token created from username and password
    //strategy name 'melinda'
    //token generation and auth usage in authRouter.js
    const alephStrategy = AlephStrategy.default;//because esmodule type vs commonjs package
    passport.use(new AlephStrategy(authAlephOptions));

    //strategy name 'jwt'
    //autheticate via 'melinda' named cookie with jwt token
    passport.use(new MelindaJwtStrategy({
      ...authJwtOptions,
      secretOrKey: authJwtOptions.secretOrPrivateKey,
      jwtFromRequest: cookieExtractor
    }, verify));

    app.use(passport.initialize());


    //---------------------------------------------------//
    // Setup Express Handlebars view engine

    const {sharedPartialsLocation, sharedPublicLocation, sharedViewsLocation} = sharedLocationOptions;

    const handlebarsOptions = {
      extname: '.hbs',
      defaultLayout: 'default',
      layoutsDir: path.join(import.meta.dirname, 'views/layouts'),
      partialsDir: [
        {dir: path.join(import.meta.dirname, 'views/partials'), namespace: 'localPartials'},
        {dir: path.join(import.meta.dirname, sharedPartialsLocation), namespace: 'sharedPartials'}
      ],
      helpers: {
        shared(param) {
          return param.startsWith('/')
            ? `/shared${param}`
            : `sharedPartials/${param}`;
        },
        object({hash}) {
          return hash;
        },
        array() {
          return Array.from(arguments).slice(0, arguments.length - 1);
        },
        ifEquals(arg1, arg2, options) { // Create a hacky version...
          // mere true or false isn't enough!
          if (arg1 === arg2) {
            return options.fn(this);
          }
          // Hack: 2ng argument is magic: use hard-coded regexp instead.
          if (arg2 === '__GENERAL_LIBRARY_REGEXP__' && arg1.search(/^(?:PIKI|NV)/u) === 0) {
            return options.fn(this);
          }
          return options.inverse(this);
        }
      }
    };

    app.engine('.hbs', engine(handlebarsOptions));

    app.set('view engine', '.hbs');

    app.set('views', [
      path.join(import.meta.dirname, 'views'),
      path.join(import.meta.dirname, sharedViewsLocation)
    ]);


    //---------------------------------------------------//
    // Setup Express logger
    // ExpressLogger is used for logging requests and responses

    app.use(createExpressLogger());


    //---------------------------------------------------//
    // Setup Express built-in middleware function 'express.urlencoded'
    // option extended is set as false:
    //    data is parsed with querystring library

    app.use(express.urlencoded({extended: false}));


    //---------------------------------------------------//
    // Setup Express built-in middleware function 'express.json'
    //    parses requests with JSON payload

    app.use(express.json());


    //---------------------------------------------------//
    // Setup Express built-in middleware function 'express.static'
    // The directory where static assets are served from is given as argument.

    app.use('/shared', express.static(path.join(import.meta.dirname, sharedPublicLocation)));
    app.use('/scripts', express.static(path.join(import.meta.dirname, 'scripts')));
    app.use('/styles', express.static(path.join(import.meta.dirname, 'styles')));


    //---------------------------------------------------//
    // Setup Express Routers for these defined routes
    //   - require authentication to all but status route

    app.use('/', createMainViewRouter(version, usernameToType(melindaApiOptions.melindaApiUsername)));

    app.use('/status', createStatusRouter());
    //app.use('/user', createUserViewRouter());

    //catch /logout call and forward to auth router
    app.use('/logout', passport.authenticate('jwt', {session: false}), (req, res) => {
      res.redirect('/rest/auth/logout');
    });
    app.use('/rest/auth', createAuthRouter(authJwtOptions));
    app.use('/rest/record', passport.authenticate('jwt', {session: false}), await createRecordRouter(melindaApiOptions, sruApiOptions));


    //---------------------------------------------------//
    // Setup handling for all other routes
    // When page is not found:
    //    -catch 404 and forward to error handler

    app.use(handlePageNotFound);


    //---------------------------------------------------//
    // Setup Express error handler

    app.use(handleAppError);


    //----------------------------------------------------//
    // Setup server to listen for connections on the specified port
    return app.listen(httpPort, appLogger.info(`Started Melinda Cyrillux in port ${httpPort}`));


    function usernameToType(id = 'UNKNOWN') { // MELINDA-12270
      if (/^(?:PIKI|NV)/u.test(id)) {
        return 'PUBLIC LIBRARY';
      }
      return 'ACADEMIC LIBRARY' + id;
    }
  }
}
