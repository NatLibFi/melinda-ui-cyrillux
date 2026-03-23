import {authGetBaseToken, authLogin} from '/scripts/callRest.mjs';
import {hidePassword} from '/shared/scripts/form.js';
import {startProcess, stopProcess} from '/shared/scripts/progressbar.js';
import {showSnackbar} from '/shared/scripts/snackbar.js';
import {eventHandled} from '/shared/scripts/uiUtils.js';

window.initialize = function () {
  console.log('Initializing Cyrillux login');
  addSubmitLoginFormEventListener();
}

function addSubmitLoginFormEventListener() {
  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', logIntoCyrillux);
}

async function logIntoCyrillux(event) {
  console.log('Submit login form event: log into Cyrillux');
  eventHandled(event);

  const passwordFormField = document.getElementById('passwordFormField');
  hidePassword(passwordFormField);

  const cookiesAndPrivacyNoticeConsent = document.getElementById('acceptTerms').checked;

  if (!cookiesAndPrivacyNoticeConsent) {
    console.log('User has to accept the terms (cookies and privacy notice) before logging into Melinda application');
    showSnackbar({style: 'info', text: 'Tietosuojaselosteen ja evästeiden käytön hyväksyminen vaaditaan'});
    return;
  }

  startProcess();

  const loginForm = document.getElementById('loginForm');
  const loginFormData = new FormData(loginForm);

  try {
    const {token} = await authGetBaseToken({
      username: loginFormData.get('loginUsername'),
      password: loginFormData.get('loginPassword')
    });
    await authLogin(token);
    location.reload();
  } catch (error) {
    console.log(error);
    showSnackbar({style: 'error', text: 'Käyttäjätunnus tai salasana on väärin'});
  } finally {
    stopProcess();
  };
}