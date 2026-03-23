/*****************************************************************************/
/* CYRILLUX: DO REST CALLS FOR CYRILLUX BACKEND ROUTES                       */
/*****************************************************************************/

/* Shared imports */
import {doRestCall} from '/shared/scripts/common.js';


/*****************************************************************************/

const RESTurl = `${window.location.protocol}//${window.location.host}/rest`;


export function addRecordToMelinda(record) {

  const restCallConfig = {
    url: `${RESTurl}/record/add`,
    method: 'POST',
    contentType: 'application/json',
    body: record,
    resultAsJson: true
  }

  return doRestCall(restCallConfig);
}


export function checkRecord(record) {

  const restCallConfig = {
    url: `${RESTurl}/record/check`,
    method: 'POST',
    contentType: 'application/json',
    body: record,
    resultAsJson: true
  }

  return doRestCall(restCallConfig);
}


export function convertFileToMarcRecords(file) {

  const restCallConfig = {
    url: `${RESTurl}/record/serialize`,
    method: 'POST',
    body: file,
    resultAsJson: true
  }

  return doRestCall(restCallConfig);
}


export function restApplyFixersToRecord(record) {

  const restCallConfig = {
    url: `${RESTurl}/record/fix`,
    method: 'POST',
    contentType: 'application/json',
    body: record,
    resultAsJson: true
  }

  return doRestCall(restCallConfig);
}


export function getRecordsByMelindaId(melindaId) {

  const restCallConfig = {
    url: `${RESTurl}/record/fetch/${melindaId}`,
    method: 'GET',
    resultAsJson: true,
    failureResult: []
  }

  return doRestCall(restCallConfig);
}


export function transliterateRecordByStandards(transliterationData) {

  const restCallConfig = {
    url: `${RESTurl}/record/transliterate`,
    method: 'POST',
    contentType: 'application/json',
    body: transliterationData,
    resultAsJson: true
  }

  return doRestCall(restCallConfig);
}


export function updateMelindaRecord(melindaId, record) {

  const restCallConfig = {
    url: `${RESTurl}/record/update/${melindaId}`,
    method: 'POST',
    contentType: 'application/json',
    body: record,
    resultAsJson: true
  }

  return doRestCall(restCallConfig);
}

//*****************************************************************************
// AUTHENTICATION (melinda login)
//*****************************************************************************
export function authGetBaseToken(authBody){
    const authConfig = {
    authUrl: 'getBaseToken',
    method: 'POST',
    token: undefined,
    body: authBody,
    resultAsJson: true
  };
  return doAuthRequest(authConfig);
}
export function authLogin(baseToken){
  const authConfig = {
    authUrl: 'login',
    method: 'GET',
    token: baseToken,
    body: undefined,
    resultAsJson: false,
    errorOnNotOk: true
  };
  return doAuthRequest(authConfig);
}
export function authVerify(){
  const authConfig = {
    authUrl: 'verify',
    method: 'GET',
    token: undefined,
    body: undefined,
    resultAsJson: true
  };
  return doAuthRequest(authConfig);
}

async function doAuthRequest({ authUrl = undefined, method = undefined, token = undefined, body = undefined, resultAsJson = false, errorOnNotOk = false}) {
  const requestUrl = `${RESTurl}/auth/${authUrl}`;
  const requestConfig = {
    method: method.toUpperCase(),
    headers: {},
    credentials: 'include',
    cache: 'no-store'
  };

  //exception configs
  setAuthHeaders();

  if (body) {
    requestConfig.headers['Accept'] = 'application/json';
    requestConfig.headers['Content-Type'] = 'application/json';
    requestConfig.body = JSON.stringify(body);
  }

  const response = await fetch(requestUrl, requestConfig);
  if (errorOnNotOk && !response.ok) {
    const notOkAuthMessage = `Call to ${authUrl} returned not ok`;
    console.warn(notOkAuthMessage);
    throw new Error(notOkAuthMessage);
  }
  if(response.redirected){
    window.location.href = response.url;
    return;
  }
  if(resultAsJson){
    return response.json();
  }
  return response;

  function setAuthHeaders() {
    if (token) {
      requestConfig.headers['Authorization'] = token;
      return;
    }

    requestConfig.headers['Access-Control-Allow-Credentials'] = true;
    requestConfig.headers['Access-Control-Allow-Headers'] = ['Origin', 'Content-Type', 'Accept', 'Authorization', 'Set-Cookie'];
  }
}