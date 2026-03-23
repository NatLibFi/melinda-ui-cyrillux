/*****************************************************************************/
/* ON LOAD FUNCTIONS FOR CYRILLUX                                            */
/*****************************************************************************/


/* Local imports */
import {doIndexedDbCheck, dbClearAllStores} from '/scripts/callDatabase.mjs';
import {addDropdownEventListeners} from '/scripts/handleToolbarActions.mjs';
import {refreshView} from '/scripts/updateView.mjs';
import {activateTransliteratedRecordPreview} from '/scripts/previewRecord.mjs';

/* Shared imports */
import {addToolbarEventListeners} from '/shared/scripts/toolbar.js';

/*****************************************************************************/

window.initialize = function () {
  console.log('Initializing Cyrillux');

  addEventListeners();
  doIndexedDbCheck();
  refreshView();

  catchLogout();
};

function addEventListeners() {
  addToolbarEventListeners()
  addDropdownEventListeners();
  activateTransliteratedRecordPreview(); // Wrong place...
}

function catchLogout(){
  const logoutLink = document.querySelector('.logout a');
  if(logoutLink){
    logoutLink.addEventListener('click', async function(event){
      //actions before user is directed to /logout
      await dbClearAllStores();
    });
  }
}
