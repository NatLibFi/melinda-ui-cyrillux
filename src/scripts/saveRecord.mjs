/*****************************************************************************/
/* CYRILLUX: SAVE TRANSLITERATED AND EDITED RECORD                           */
/*****************************************************************************/

/* Local imports */
import {dbGetOriginalRecord, dbSetSavedRecord, dbSetSourceRecord} from '/scripts/callDatabase.mjs';
//  dbClearOriginalRecord, dbClearTransliteratedRecord, dbGetOriginalRecord,
//  dbGetAllSavedRecordKeys, dbGetSavedRecord, dbGetTransliteratedRecord, dbSetOriginalRecord
//} from '/scripts/callDatabase.mjs';
import {addRecordToMelinda, checkRecord, getRecordsByMelindaId, updateMelindaRecord} from '/scripts/callRest.mjs';
import {booleanCheckRecord} from '/scripts/checkRecord.mjs';
import {getRecordMelindaId} from '/scripts/listRecords.mjs';
import {editorSettings} from '/scripts/previewRecord.mjs';
import {refreshView} from '/scripts/updateView.mjs';
import {selectSourceRecord} from '/scripts/selectRecord.mjs';



/* Shared imports */
import {deactivateEditorButtons} from '/shared/scripts/editorButtons.js';
import {displayErrors, displayNotes, markAllFieldsUneditable} from '/shared/scripts/editorUtils.js';
import {convertFieldsToRecord, extractErrors, getEditorFields} from '/shared/scripts/marcRecordUi.js';
import {startProcess, stopProcess} from '/shared/scripts/progressbar.js';
import {showSnackbar} from '/shared/scripts/snackbar.js';

//import {eventHandled} from '/shared/scripts/uiUtils.js';

export async function saveEditorRecordToMelinda(event) {
  // Check local errors:
  const validationErrors = extractErrors(editorSettings);

  if (validationErrors.length > 0) {
    const mainErrorMessage = 'Tietueessa on virheitä, joten sitä ei pysty vielä päivittämään';
    displayErrors([mainErrorMessage, ...validationErrors]);
    showSnackbar({style: 'alert', text: mainErrorMessage});
    console.log(mainErrorMessage);
    return;
  }
  displayNotes([]); // empty editor notes
  startProcess(); // progress bar on, does this show here? If not, copy from artikkelit...

  // Deactivate editor (prevent changes during update):
  deactivateEditorButtons();
  markAllFieldsUneditable(editorSettings);

  // Convert fields to a proper marc JSON record
  const fieldsInEditor = getEditorFields(editorSettings.editorDivId, editorSettings.subfieldCodePrefix);
  const record = convertFieldsToRecord(fieldsInEditor, editorSettings);
  // Proceed: if server-side check goes though, proceed to callback saveCheckedRecord(), recordSaveFailed is the callback for failed record
  const canSave = await booleanCheckRecord(record, recordSaveFailed);

  if (!canSave) {
    stopProcess();
    return;
  }

  //console.log(`VALIDATION RESULT: ${canSave ? 'OK' : 'FAIL'}`);
  saveRecordToMelinda(record);

};


/*****************************************************************************/

export function removeFieldIds(record) {
  record.fields.forEach(field => {
    delete field.uuid;
  });
}


/*
export async function isSaved(record) {
  const recordId = record.id;

  try {
    const savedRecords = await dbGetAllSavedRecordKeys();
    return savedRecords.includes(recordId);
  } catch (error) {
    console.log('Error while trying to check if a record is saved', error);
  }
}
*/


/*****************************************************************************/

function saveRecordToMelinda(record) {
  removeFieldIds(record);
  delete record.id;
  delete record.melindaId;
  console.log

  const melindaId = getRecordMelindaId(record);
  console.log(`saveRecordToMelinda(ID:${melindaId || 'NEW'})`);

  //console.log(JSON.stringify(record));

  melindaId
    ? doUpdate(melindaId, record)
    : doAdd(record)

}

function doUpdate(melindaId, record) {

  updateMelindaRecord(melindaId, JSON.stringify(record))
    .then((result) => {
      //console.log(`DU-UP done for ${recordId}`);

      if (result.recordStatus === 'UPDATED') {
        recordSaveSuccess(result, record);
        return;
      }

      recordSaveFailed(result);

    })
    .catch((error) => {
      console.log('Record save failed, error: ', error);
      showSnackbar({style: 'error', text: 'Virhe tietueen päivittämisessä Melindaan'});
    })
    .finally(() => {
      stopProcess();
    });
}


function doAdd(record) {

  addRecordToMelinda(JSON.stringify(record))
    .then((result) => {

      if (result.recordStatus === 'CREATED') {
        recordSaveSuccess(result, record);
        return;
      }

      recordSaveFailed(result);

    })
    .catch((error) => {
      console.log('Adding record to Melinda failed, error: ', error);
      showSnackbar({style: 'error', text: 'Virhe tietueen lisäämisessä Melindaan'});
    })
    .finally(() => {
      stopProcess();
    });
}



async function recordSaveSuccess(result, record) { // test with 3451
  console.log('Record saved with message: ', result.message);

  console.log(JSON.stringify(result));
  console.log('Database ID: ', result.databaseId);

  const button = createCopyToClipboardButton(result.databaseId);
  showSnackbar({style: 'success', text: 'Tietueen tallennus onnistui!', linkButton: button});

  const originalRecord = await dbGetOriginalRecord(); // Fetch the id (just a bit overkill...)
  updateRecordDataInApp(result.databaseId, originalRecord.id);

  // savedRecords are needed for marking saved record as checked in record list.
  console.log(`Mark record as saved`);
  const originalSourceRecord = await dbGetOriginalRecord();
  await dbSetSavedRecord(originalSourceRecord.id, result.databaseId);


  /* // NV: I don't think these are sane/required anymore...
  dbClearOriginalRecord();
  dbClearTransliteratedRecord();
  */
}


export function recordSaveFailed(resultOrError = {'message': 'Unknown error', 'detailedRecordStatus': 'Unknown error'}) {
  console.log(`Failure type: ${typeof resultOrError}`);
  console.log(JSON.stringify(resultOrError));
  console.log('Record was not saved, message: ', resultOrError.message);

  showSnackbar({style: 'alert', text: `Tietuetta ei voitu tallentaa: ${resultOrError.detailedRecordStatus}`});
}


function createCopyToClipboardButton(melindaId) { // Uh. why
  const button = document.createElement('button');
  button.innerHTML = `Kopioi Melinda-ID ${melindaId} leikepöydälle`;
  button.title = melindaId;
  button.addEventListener('click', () => {
    navigator.clipboard.writeText(melindaId);
  });

  return button;
}

async function updateRecordDataInApp(melindaId, indexedDbId) {
  // TODO: fetch record from Melinda, update original record in db, update both editors
  console.log(`Fetch (FI-MELINDA)${melindaId} for indexdb and record displays!`);
  const [record] = await getRecordsByMelindaId(melindaId);
  if (record) {
    record.id = indexedDbId;
    dbSetSourceRecord(indexedDbId, record)
      .then(() => {
        selectSourceRecord(indexedDbId);
      })
      .catch(error => {
        showSnackbar({style: 'alert', text: 'Ongelma tallennetun tietueen päivittämisen jälkeen!'});
        console.log('Error while trying to display updated record', error);
      })
      ;
    /*
    console.log('UPDATE LHS VIEW');
    const previewDiv = document.getElementById('recordPreview');
    showRecordInDiv(record, previewDiv, previewSettings); // TODO: This should come from DB

    console.log('UPDATE RHS VIEW');
    const editorDiv = document.getElementById('transliteratedRecordPreview');
    showRecordInDiv(record, editorDiv, editorSettings);
    */
    refreshView(); // Do we need this (or some of the above code?)
  }
}