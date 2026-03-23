/*****************************************************************************/
/* CYRILLUX: SEARCH SOURCE RECORD                                            */
/*****************************************************************************/

/* Local imports */
import {getRecordsByMelindaId} from '/scripts/callRest.mjs';
import {importRecords} from '/scripts/importRecord.mjs';


/* Shared imports */
import {startProcess, stopProcess} from '/shared/scripts/progressbar.js';
import {showSnackbar} from '/shared/scripts/snackbar.js';

/*****************************************************************************/

export async function searchRecord(melindaId = false) {
  startProcess();

  const recordId = melindaId || document.getElementById('recordSearchInput').value;

  let marcRecords;
  try {
    marcRecords = await getRecordsByMelindaId(recordId);
    if (marcRecords.length === 0) {
      throw new Error('Haku epäonnistui!');
    }
  }
  catch (error) {
    const msg = error ? error : 'Tarkista syöttämäsi Melinda-ID.';
    showSnackbar({style: 'alert', text: `Virhe tietueen haussa! ${msg}`});
    console.log(`Error while trying to fetch record by id ${recordId}`, error);
    stopProcess();
    return;
  }

  importRecords(marcRecords, recordId);
  stopProcess();
}

export function resetRecordSearchInput() {
  document.getElementById('recordSearchInput').value = '';
}



