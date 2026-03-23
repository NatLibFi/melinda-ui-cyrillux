/*****************************************************************************/
/* CYRILLUX: CHECK ORIGINAL AND TRANSLITERATED RECORDS                       */
/*****************************************************************************/

/* Local imports */
import {dbGetOriginalRecord, dbSetRecordNote, dbGetTransliteratedRecord} from '/scripts/callDatabase.mjs';
import {checkRecord} from '/scripts/callRest.mjs';
import {getRecordMelindaId} from '/scripts/listRecords.mjs'
//import {removeFieldIds} from '/scripts/saveRecord.mjs';

/* Shared imports */
//import {enableElement} from '/shared/scripts/elements.js'
import {startProcess, stopProcess} from '/shared/scripts/progressbar.js';
import {showSnackbar} from '/shared/scripts/snackbar.js';


/*****************************************************************************/

export function findRecordChanges() {
  // NB! The post-transliteration record is not currently stored, and is thus incomparable...
  const originalRecordPromise = dbGetOriginalRecord();
  const transliteratedRecordPromise = dbGetTransliteratedRecord();

  Promise
    .all([originalRecordPromise, transliteratedRecordPromise])
    .then(([originalRecord, transliteratedRecord]) => {
      createChangeReports(originalRecord, transliteratedRecord);
    })
    .catch(error => {
      showSnackbar({style: 'alert', text: 'Virhe alkuperäisen tietueen ja translitteroidun tietueen vertailussa'});
      console.log('Error while trying to find record changes', error);
    });

}

/*****************************************************************************/

/*
function checkRecordForCreation(transliteratedRecord) {
  checkRecord(JSON.stringify(transliteratedRecord))
    .then((result) => {

      if (result.detailedRecordStatus === 'CREATED') {
        validationPassed();
        return;
      }

      if (result.detailedRecordStatus === 'CONFLICT') {
        validationConflict(result);
        return;
      }


    })
    .catch((error) => {
      ... sumthing
    })
}
*/

/*
function checkRecordForUpdate(transliteratedRecord, melindaId) {
  // Umm... is this identical with the orher checkRecord nowadays?
  transliteratedRecord.melindaId = melindaId;

  checkRecord(JSON.stringify(transliteratedRecord))
    .then((result) => {

      if (result.detailedRecordStatus === 'UPDATED') {
        validationPassed();
        return;
      }

      if (result.detailedRecordStatus === 'CONFLICT') {
        validationConflict(result);
        return;
      }

    })
    .catch((error) => {
      validationFailed(error);
    })

}
*/

function createChangeReports(originalRecord, transliteratedRecord) {
  const changeReports = [];

  transliteratedRecord.fields.forEach(transliteratedRecordField => {
    const originalRecordField = getRecordField(originalRecord, transliteratedRecordField.uuid);
    const report = getChangeReport(originalRecordField, transliteratedRecordField);

    if (report) {
      changeReports.push(report);
    }
  })

  dbSetRecordNote('transliteratedRecordChanges', changeReports)


  function getRecordField(record, id) {
    return record.fields.find(field => field.uuid === id);
  }

}


function getChangeReport(originalRecordField, transliteratedRecordField) {

  const changeReportBase = {
    uuid: transliteratedRecordField.uuid,
    originalRecordField: originalRecordField,
    transliteratedRecordField: transliteratedRecordField,
  }

  if (!originalRecordField) {
    return {change: 'add', ...changeReportBase};
  }

  if (!transliteratedRecordField) {
    return {change: 'delete', ...changeReportBase};
  }

  /* just a simple comparison for now */
  if (JSON.stringify(originalRecordField) !== JSON.stringify(transliteratedRecordField)) {
    return {change: 'edit', ...changeReportBase};
  }

  return;

}

/*
function validationPassed() {
  console.log('Transliterated record passed check!')

  const confirmButton = document.querySelector('.record-save .dialog-confirm-button');

  enableElement(confirmButton);
  stopProcess();
}
*/

/*
function validationFailed(error) {
  console.log('Transliterated record failed check: ', error.message);

  showSnackbar({style: 'alert', text: 'Virhe translitteroidun tietueen tarkistuksessa. Tietuetta ei voi tallentaa.'});
  stopProcess();
}
  */

/*
function validationConflict(result) {
  const conflictedMelindaID = result.databaseId;
  showSnackbar({style: 'alert', text: `Tarkista onko vastaava tietue jo luotu aiemmin Melinda ID:llä ${conflictedMelindaID}`});
  stopProcess();
}
*/


export function localIsDeletedRecord(record) {
  if (record.leader && record.leader.charAt(6) === 'd') {
    return true;
  }
  if (record.fields?.some(f => f.tag === 'STA' && f.subfields.some(sf => sf.code === 'a' && sf.value === 'DELETED'))) {
    return true;
  }
  if (record.fields?.some(f => f.tag === 'DEL')) {
    return true;
  }
  return false;
}


export async function booleanCheckRecord(record, callbackForFailure = doNothing) {
  const melindaId = getRecordMelindaId(record);
  let ok = true;
  let result;

  if (melindaId) {
    record.melindaId = melindaId;
  }
  console.log(`validate record ${melindaId || '(non-Melinda)'}`);

  try {
    result = await checkRecord(JSON.stringify(record));
  }
  catch(error) {
    ok = false;
  }

  if (ok) {
    if (melindaId && result.detailedRecordStatus === 'UPDATED') {
      return true;
    }
    if (!melindaId && result.detailedRecordStatus === 'CREATED') {
      return true;
    }
    if (result.detailedRecordStatus === 'CONFLICT') {
      callbackForFailure(result);
      return false;
    }
  }

  console.log('Unexpected validation result');
  console.log(JSON.stringify(result));
  callbackForFailure(result);
  return false;

  function doNothing() {

  }
}
