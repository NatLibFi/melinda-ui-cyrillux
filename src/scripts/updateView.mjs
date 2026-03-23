/*****************************************************************************/
/* CYRILLUX: UPDATE CYRILLUX VIEW: REFRESH AND RESET                         */
/*****************************************************************************/

/* Local imports */
import {dbClearAllStores, dbClearOriginalRecord, dbClearTransliteratedRecord, dbDelRecordNote, dbDelSavedRecord, dbDelSourceRecord, dbDelOriginalRecord, dbDelTransliteratedRecord} from '/scripts/callDatabase.mjs';
import {resetStandardInput} from '/scripts/configureRecord.mjs';
import {resetHiddenFileInput, resetRecordImportInput} from '/scripts/importRecord.mjs';
import {refreshRecordListPanel} from '/scripts/listRecords.mjs';
import {refreshRecordPreviews} from '/scripts/previewRecord.mjs';
import {resetRecordSearchInput} from '/scripts/searchRecord.mjs';


/* Shared imports */
import {showSnackbar} from '/shared/scripts/snackbar.js';
import {refreshToolbar} from '/shared/scripts/toolbar.js';

/*****************************************************************************/


export function refreshView() {
  refreshToolbar();
  refreshRecordListPanel();
  refreshRecordPreviews();
}

export async function resetApp() {
  await dbClearAllStores();
  clearInputs();
  refreshView();
  showSnackbar({style: 'success', text: 'Sovelluksen tiedot tyhjätty, palataan aloitusnäkymään!'});
}

export async function removeRecordFromApp(recordId) {
  await dbDelSourceRecord(recordId);
  await dbDelSavedRecord(recordId);
  await dbDelRecordNote(recordId);
  const tag = document.getElementById(recordId);
  if (tag && tag.classList?.contains('selected')) {
    dbDelOriginalRecord();
    dbDelTransliteratedRecord();
    dbClearOriginalRecord();
    dbClearTransliteratedRecord();
  }
  await refreshView();
  showSnackbar({style: 'success', text: 'Tietue poistettu!'});
 

}

export async function resetPreview() {
  await dbClearOriginalRecord();
  await dbClearTransliteratedRecord();
  await dbDelRecordNote('transliteratedRecordChanges');
  await dbDelRecordNote('transliteratedRecordWarnings');
  refreshView();
  showSnackbar({style: 'success', text: 'Tietueiden esikatselu tyhjennetty!'});
}

export async function clearDB() {
  console.log('Clearing all indexed database stores');
  await dbClearAllStores();
}

/*****************************************************************************/

function clearInputs() {
  resetRecordSearchInput();
  resetRecordImportInput();
  resetHiddenFileInput();
  resetStandardInput();
}