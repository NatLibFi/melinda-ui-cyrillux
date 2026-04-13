import {readEnvironmentVariable} from '@natlibfi/melinda-backend-commons';

export const httpPort = readEnvironmentVariable('HTTP_PORT', {defaultValue: 8080, format: v => Number(v)});
export const enableProxy = readEnvironmentVariable('ENABLE_PROXY', {defaultValue: false, format: v => parseBoolean(v)});

export const melindaApiOptions = {
  melindaApiPassword: readEnvironmentVariable('MELINDA_API_PASSWORD', {defaultValue: ''}),
  melindaApiUrl: readEnvironmentVariable('MELINDA_API_URL', {defaultValue: false}),
  melindaApiUsername: readEnvironmentVariable('MELINDA_API_USERNAME', {defaultValue: ''}),
};

export const sharedLocationOptions = {
  sharedPartialsLocation: readEnvironmentVariable('SHARED_PARTIALS_LOCATION', {defaultValue: '../node_modules/@natlibfi/melinda-ui-commons/src/views/partials'}),
  sharedPublicLocation: readEnvironmentVariable('SHARED_PUBLIC_LOCATION', {defaultValue: '../node_modules/@natlibfi/melinda-ui-commons/src'}),
  sharedViewsLocation: readEnvironmentVariable('SHARED_VIEWS_LOCATION', {defaultValue: '../node_modules/@natlibfi/melinda-ui-commons/src/views'})
}

export const sruApiOptions = {
  sruApiUrl: readEnvironmentVariable('SRU_API_URL')
};

export const authAlephOptions = {
  xServiceURL: readEnvironmentVariable('ALEPH_X_SVC_URL'),
  userLibrary: readEnvironmentVariable('ALEPH_USER_LIBRARY'),
  ownAuthzURL: readEnvironmentVariable('OWN_AUTHZ_URL'),
  ownAuthzApiKey: readEnvironmentVariable('OWN_AUTHZ_API_KEY')
};
export const authJwtOptions = {
  secretOrPrivateKey: readEnvironmentVariable('JWT_SECRET'),
  issuer: readEnvironmentVariable('JWT_ISSUER', {defaultValue: 'melinda-'}),
  audience: readEnvironmentVariable('JWT_AUDIENCE', {defaultValue: 'melinda-'}),
  algorithms: readEnvironmentVariable('JWT_ALGORITHMS', {defaultValue: ['HS512'], format: (v) => JSON.parse(v)})
};


// Hard-coded is for browser:
export const version = process.env.npm_package_version || '2.0.9';
