/*****************************************************************************/
/* CYRILLUX: SELECT STANDARDS FOR TRANSLITERATION: sfs4900 and iso9          */
/*****************************************************************************/

/* Local imports */
import {transliterateRecord} from '/scripts/transliterateRecord.mjs';
import {refreshView} from '/scripts/updateView.mjs';


/* Shared imports */
import {showSnackbar} from '/shared/scripts/snackbar.js';


/*****************************************************************************/

export function handleStandardChange() {
  console.log('Standard selection was changed!')

  showSnackbar({style: 'info', text: 'Standardivalinnan muutos translitteroi aina alkuperäisen tietueen uudelleen'});
  refreshView();
  transliterateRecord();
}

export function getAllSelectedStandards() {
  const standards = [...getAllStandardCheckboxes()];

  const selectedStandards = standards
    .filter(standard => standard.checked)
    .map(standard => standard.name);

  return selectedStandards;
}

export function resetStandardInput() {
  // Use form, as default values are different for public and academic libraries. (Public libraries want to prefer SFS4 900.)
  document.getElementById('standard-options-form').reset();
  /*
  document.getElementById('iso9').checked = true;
  document.getElementById('sfs4900').checked = true;
  document.getElementById('preferSFS4900').checked = false;
  */
}

/*****************************************************************************/

function getAllStandardCheckboxes() {
  return document.querySelectorAll('#recordConfigureDropdown input[type=checkbox]')
}