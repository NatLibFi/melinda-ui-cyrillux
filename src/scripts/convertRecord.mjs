/*****************************************************************************/
/* CYRILLUX: CONVERT RECORD TO MELINDA RECORD BEFORE SAVING AS SOURCE RECORD */
/*****************************************************************************/

/* Local imports */
import {restApplyFixersToRecord} from '/scripts/callRest.mjs';

/* Shared imports */
import {startProcess, stopProcess} from '/shared/scripts/progressbar.js';
import {showSnackbar} from '/shared/scripts/snackbar.js';


/*****************************************************************************/


export async function applyFixersToRecords(records) {
  const melindaRecords = await Promise.all(records.map((record) => applyFixers(record)));

  return melindaRecords;
}


/*****************************************************************************/

async function applyFixers(record) {
  startProcess();

  try {
    const convertedRecordResult = await restApplyFixersToRecord(JSON.stringify(record));
    return convertedRecordResult.record;
  } catch (error) {
    showSnackbar({style: 'alert', text: 'Ongelma haetun tai tuodun tietueen konvertoinnissa'});
    console.log('Error while trying to convert record before setting it as source record', error.validationResults.errors);
  } finally {
    stopProcess();
  }
}
