/*****************************************************************************/
/* CYRILLUX: TRANSLITERATE ORIGINAL RECORD                                   */
/*****************************************************************************/

/* Local imports */
import {dbDelTransliteratedRecord, dbGetOriginalRecord, dbSetRecordNote, dbSetTransliteratedRecord} from '/scripts/callDatabase.mjs';
import {transliterateRecordByStandards} from '/scripts/callRest.mjs';
import {findRecordChanges} from '/scripts/checkRecord.mjs';
import {getAllSelectedStandards} from '/scripts/configureRecord.mjs';
import {activateTransliteratedRecordPreview, showWarnings} from '/scripts/previewRecord.mjs';

/* Shared imports */
import {startProcess, stopProcess} from '/shared/scripts/progressbar.js';
import {showSnackbar} from '/shared/scripts/snackbar.js';


/*****************************************************************************/

export async function transliterateRecord() {
  startProcess();

  try {
    const originalRecord = await dbGetOriginalRecord();

    if (!originalRecord) {
      return;
    }

    console.log('Original record for transliteration: ', originalRecord.id);
    doTransliteration(originalRecord);
  } catch (error) {
    showSnackbar({style: 'alert', text: 'Ongelma alkuperäisen tietueen translitteroinnissa!'});
    console.log('Error while trying to get original record for transliteration', error);
  } finally {
    stopProcess();
  }

}


/*****************************************************************************/


function doTransliteration(record) {

  if (!record) {
    return;
  }

  const selectedStandards = getAllSelectedStandards();

  const transliterationConfig = {
    record: record,
    standards: selectedStandards
  }

  transliterateRecordByStandards(JSON.stringify(transliterationConfig))
    .then((transliterationResult) => {
      //console.log('Transliteration record id in: ', record.id);
      console.log('Transliteration result: ', transliterationResult);

      const transliteratedRecord = transliterationResult.record;
      transliteratedRecord.id = record.id;
      delete transliteratedRecord._validationOptions;
      //console.log('Transliteration record id: ', record.id);
      dbSetTransliteratedRecord(transliteratedRecord);
      dbSetRecordNote('transliteratedRecordWarnings', transliterationResult.warnings);
      findRecordChanges();
    })
    .then(() => {
      activateTransliteratedRecordPreview();
      showSnackbar({style: 'success', text: 'Alkuperäisen tietueen translitterointi on valmis'});
    })
    .then(() => {
      showWarnings();
    })
    .catch(error => {
      handleTransliterationError();
      const msg = error ? error : '(error is undefined)';
      console.log('Error in transliteration process', msg);
    })
}


function handleTransliterationError() {

  dbDelTransliteratedRecord()
    .then(() => {
      // Should we say something else if nothing is done?
      showSnackbar({style: 'alert', text: 'Ongelma alkuperäisen tietueen translitteroinnissa!'});
      activateTransliteratedRecordPreview();
    })
}
