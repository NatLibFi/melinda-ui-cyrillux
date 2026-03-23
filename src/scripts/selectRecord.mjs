/*****************************************************************************/
/* CYRILLUX: SELECT SOURCE RECORD FOR ORIGINAL RECORD                        */
/*****************************************************************************/

/* External module imports */
import {v4 as uuid} from '/external/modules/uuid';

/* Local imports */
import {dbGetSourceRecord, dbSetOriginalRecord} from '/scripts/callDatabase.mjs';
import {activateOriginalRecordPreview} from '/scripts/previewRecord.mjs';
import {transliterateRecord} from '/scripts/transliterateRecord.mjs';

/* Shared imports */
import {showSnackbar} from '/shared/scripts/snackbar.js';


/*****************************************************************************/

export function selectRecord(recordId, panelId) {

  if (panelId === 'sourceRecordListPanel') {
    selectSourceRecord(recordId);
  }

};

/*****************************************************************************/

export function selectSourceRecord(recordId) {
  console.log(`selectSourceRecord(${recordId})`);

  dbGetSourceRecord(recordId)
    .then(sourceRecord => {
      addFieldIds(sourceRecord);
      console.log(` selectSourceRecord(${recordId}=${sourceRecord.id})`);
      dbSetOriginalRecord(sourceRecord);
    })
    .then(() => {
      activateOriginalRecordPreview();
    })
    .then(() => {
      transliterateRecord();
    })
    .catch(error => {
      showSnackbar({style: 'alert', text: 'Ongelma valitun tietueen näyttämisessä!'});
      console.log('Error while trying to select record', error);
    })
}

function addFieldIds(record) {
  record.fields.forEach(field => {
    field.uuid = uuid();
  });
}
