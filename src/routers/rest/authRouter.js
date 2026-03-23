/*****************************************************************************/
/* ROUTE REQUESTS TO SERVICES                                                */
/*****************************************************************************/

//TODO: imports and whatnot here
import passport from 'passport';
import { Router } from 'express';
import { createLogger } from '@natlibfi/melinda-backend-commons';
import HttpStatus from 'http-status';
import { generateAuthorizationHeader } from '@natlibfi/melinda-commons';
import { generateJwtToken } from '@natlibfi/passport-melinda-jwt';

import { handleError, handleFailedRouteParams, handleFailedQueryParams, handleFile } from '../routerUtils/routerUtils.js';
/*****************************************************************************/

export function createAuthRouter(jwtOptions) {
    const logger = createLogger();

    //expected cookie name for jwt token is from passport-melinda-jwt-js cookieExtractor function,
    //set to be used in app.js MelindaJwtStrategy jwtFromRequest
    const cookieNames = {
        userToken: 'melinda'
    };

    return new Router()
        .use(handleFailedQueryParams)
        .post('/getBaseToken', getBaseToken)
        .get('/login', passport.authenticate('melinda', { session: false }), login)
        .get('/verify', passport.authenticate('jwt', { session: false }), verify)
        .get('/logout', passport.authenticate('jwt', { session: false }), logout)
        .use(handleError);

    function getBaseToken(req, res) {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(500).json({ error: 'username or password malformed or missing' });
            return;
        }
        try {
            const cleanUserName = sanitizeString({ value: username, options: { allowedPattern: 'a-zA-Z0-9_\\-äöåÄÖÅ' } });
            const authToken = generateAuthorizationHeader(cleanUserName, password);

            res.json({ token: authToken });
        } catch (error) {
            res.status(500).json({ error: 'Failed to either process user info or generate token.' });
        }
    }
    function login(req, res) {
        // Strip files
        //token itself is valid 120h
        const { id, authorization } = req.user;
        const displayName = getAuthUserDisplayName(req);
        const jwtToken = generateJwtToken({ displayName, id, authorization }, jwtOptions);

        //set required data to cookie with proper options
        const isInProduction = process.env.NODE_ENV === 'production';
        //cookie age in hours
        const cookieAgeDevelopment = 12;
        const cookieAgeProduction = 9;
        const cookieAge = getHoursInMilliSeconds(isInProduction ? cookieAgeDevelopment : cookieAgeProduction);

        const tokenCookieOptions = {
            httpOnly: true,
            SameSite: 'None',
            secure: isInProduction,
            maxAge: cookieAge
        };
        res.cookie(cookieNames.userToken, jwtToken, tokenCookieOptions);

        res.sendStatus(HttpStatus.OK);
    }
    function verify(req, res) {
        res.status(HttpStatus.OK).json({ name: getAuthUserDisplayName(req) });
    }
    function logout(req, res) {
        Object.keys(cookieNames).forEach(cookieKey => {
            const cookieName = cookieNames[cookieKey];
            res.clearCookie(cookieName);
        });
        res.redirect('/');
    }

    //************************ */
    //helper functions
    //************************ */

    function sanitizeString(param0) {
        const { value, options = { allowedPattern: undefined, useLengthCheck: true, min: 1, max: 12 } } = param0;
        if (!options || !options?.allowedPattern) {
            return value;
        }

        const cleanValue = value.replace(new RegExp(`[^${options.allowedPattern}]`, 'gu'), '');

        if (options.useLengthCheck && (cleanValue.length < options.min || cleanValue.length > options.max)) {
            throw new Error(`Value given to sanitaze must be between ${options.min} and ${options.max} characaters`);
        }

        return cleanValue;
    }

    function getHoursInMilliSeconds(requestedHourCount) {
        return requestedHourCount * 60 * 60 * 1000;
    }
}

/**
 * Middleware to check authentication using JWT strategy and handle redirection based on the result
 *
 * @param {object} [params={}]
 * @param {string} [params.failureRedirects] - url path to redirect to when error or no userdata after authentication
 * @param {string} [params.successRedirects] - url path to redirect to when authentication is successfull and accepted
 * @param {boolean} [params.allowUnauthorized=false] - option to give not logged in users access to, used for example with /login making sure authorized users dont get access to login again
 * @returns {Function} - middleware function to handle auth and reroroute
 *
 * @example
 * // Use without any redirection options, unauth unauthorized sends unauthorized response
 * app.get('/', authCheck(), (req, res) => {
 *     res.sendStatus(HttpStatus.OK);
 * });
 *
 * @example
 * // Redirect to /login if authentication fails
 * app.get('/', authCheck({ failureRedirect: '/login' }), (req, res) => {
 *     res.sendStatus(HttpStatus.OK);
 * });
 *
 * @example
 * // Redirect to /dashboard if authentication succeeds
 * app.get('/', authCheck({ successRedirect: '/dashboard' }), (req, res) => {
 *     res.sendStatus(HttpStatus.OK);
 * });
 *
 * @example
 * // Redirect to /login if authentication fails, and to /dashboard if authentication succeeds
 * app.get('/', authCheck({ failureRedirect: '/login', successRedirect: '/dashboard' }), (req, res) => {
 *     res.sendStatus(HttpStatus.OK);
 * });
 *
 */
export function authCheck(params = {}) {
    const { failureRedirects, successRedirects, allowUnauthorized = false } = params;
    return (req, res, next) => {
        passport.authenticate('jwt', { session: false }, (err, user, info) => {
            if (err || !user) {
                if (failureRedirects) {
                    return res.redirect(failureRedirects);
                }
                if(allowUnauthorized){
                    return next();
                }
                return res.status(401).send('Unauthorized');
            }

            //make sure useradata is included in req
            req.user = user;

            if (successRedirects) {
                return res.redirect(successRedirects);
            }

            return next();
        })(req, res, next);
    };
}


/**
 * Make sure authenticated user does have some name available, even if some data is not filled in to user account
 *
 * @param {object} req request, that should have user field
 * @returns {string}
 */
export function getAuthUserDisplayName(req){
    return req.user.displayName || req.user.id || 'melinda-user';
}