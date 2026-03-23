/*****************************************************************************/
/* CYRILLUX: PREVIEW ORIGINAL AND TRANSLITERATED RECORDS                     */
/*****************************************************************************/

/* Local imports */
import {dbGetOriginalRecord, dbGetRecordNote, dbGetTransliteratedRecord} from '/scripts/callDatabase.mjs';
import { saveEditorRecordToMelinda } from '/scripts/saveRecord.mjs';
/* Shared imports */
import {initEditorButtonsHandlers} from '/shared/scripts/editorButtons.js';
import {addEditorRowListerers} from '/shared/scripts/editorEvents.js';
import {displayErrors, displayNotes, isEditableDiv} from '/shared/scripts/editorUtils.js';
import {extractErrors, showRecordInDiv} from '/shared/scripts/marcRecordUi.js';
import {showSnackbar} from '/shared/scripts/snackbar.js';

import {eventHandled} from '/shared/scripts/uiUtils.js';

const sharedSubfieldCodePrefix = '$$';

export const editorSettings = { // transliterated record, see artikkelit for definitions
  editorDivId: 'transliteratedRecordPreview', // ID of the html tag within which the fields are stored
  editableField: isEditableField,
  editableRecord: isEditableRecord,
  hideCancelEditButton: true,
  newFieldValue: `TAG##${sharedSubfieldCodePrefix}aLorum Ipsum.`,
  subfieldCodePrefix: sharedSubfieldCodePrefix,
  uneditableFieldBackgroundColor: 'gainsboro',
};

export const previewSettings = { // original record
  editorDivId: 'recordPreview', // ID of the html tag within which the fields are stored
  //editableField: isEditableField,
  //editableRecord: isEditableRecord,
  subfieldCodePrefix: sharedSubfieldCodePrefix
  //uneditableFieldBackgroundColor: 'gainsboro',
};

const cyrillicCharRegexp = /[\u0400-\u052F]/u; // NV: I think this suffices and we don't transliterate the extensions. For full mapping, see: https://en.wikipedia.org/wiki/Cyrillic_script_in_Unicode

function isEditableRecord(record) {
  return record.fields.some(f => fieldContainsCyrillicData(f));

  function fieldContainsCyrillicData(field) {
    if (!field.subfields) {
      return false;
    }

    return field.subfields.some(sf => subfieldContainsCyrillicData(sf));
  }

  function subfieldContainsCyrillicData(subfield) {
    if (!subfield.value) {
      return false;
    }
    return subfield.value.split('').some(c => c.match(cyrillicCharRegexp));
  }
}

function isEditableField(field, recordIsEditable = true) {
  if (!recordIsEditable) {
    return false;
  }
  if (['CAT', 'LDR', 'LOW', '001', '003', '005', '006', '007', '008', '015', '035', '960'].includes(field.tag)) {
    return false;
  }

  return true;
}

function initFieldHandlers(record, settings) {
  const divForFields = document.getElementById(settings.editorDivId);

  //showRecordInDiv(record, divForFields, editorSettings);

  const fieldDivs = [...divForFields.children]; // converts children into an editable array

  if (fieldDivs.length === record.fields.length + 1) {
    //console.log("Set inner contentEditables")
    fieldDivs.forEach(f => fieldHandleListeners(f, settings));
  }

  // Buttons:

  function fieldHandleListeners(fieldElem) {
    if (!isEditableDiv(fieldElem)) { // No listeners needed
      return;
    }

    addEditorRowListerers(fieldElem, settings);
    // addFocusHandler(fieldElem);
  }
}

window.saveEditorRecord = function (event = undefined) {
  saveEditorRecordToMelinda(event);
}

//---------------------------------------------------------------------------//
// Validate record button in editor button row
window.validateEditorRecord = function (event = undefined) {
  console.log('Validate editor record...');

  eventHandled(event); // prevents editor window from closing! (has this comment become obsolete?)

  // 1. Show errors Convert edit data to a record
  const validationErrors = extractErrors(editorSettings);

  if (validationErrors.length > 0) {
    const mainErrorMessage = 'Tietueessa on virheitä!';
    displayErrors([mainErrorMessage, ...validationErrors]);
    showSnackbar({style: 'alert', text: mainErrorMessage});
    console.log(mainErrorMessage);
    return;
  }
  displayNotes(['Tietueesta ei löytynyt virheitä']);
}

/*****************************************************************************/

export async function activateOriginalRecordPreview() {
  try {
    const originalRecord = await dbGetOriginalRecord();
    const previewDiv = document.getElementById('recordPreview');
    showRecordInDiv(originalRecord, previewDiv, previewSettings);

  } catch (error) {
    showSnackbar({style: 'alert', text: 'Valitettavasti alkuperäistä tietuetta ei voida näyttää esikatselussa'});
    console.log('Error while trying to get original record from database and show it', error);
  }

}

function setButtowRowDisplay(value) {
  const buttonRowElem = document.getElementById('editorButtons');
  if (buttonRowElem) {
    buttonRowElem.style.display = value;
  }
}

export async function activateTransliteratedRecordPreview() {
  window.activeFieldElement = undefined;

  try {
    const previewDiv = document.getElementById('transliteratedRecordPreview');
    const transliteratedRecord = await dbGetTransliteratedRecord();

    if (!transliteratedRecord) {
      previewDiv.innerHTML = '';
      setButtowRowDisplay('none');
      console.log('No transliterated record received!');
      return;
    }

    initButtons(transliteratedRecord);

    showRecordInDiv(transliteratedRecord, previewDiv, editorSettings);
    initFieldHandlers(transliteratedRecord, editorSettings);
    //activateEditorButtons();
    showChanges(transliteratedRecord); // Does this currently work? I do doubt it...

  } catch (error) {
    showSnackbar({style: 'alert', text: 'Valitettavasti translitteroitua tietuetta ei voida näyttää esikatselussa'});
    console.log('Error while trying to get transliterated record from database and show it', error);
  }


  function initButtons(transliteratedRecord) {
    const showButtons = isEditableRecord(transliteratedRecord);

    setButtowRowDisplay(showButtons ? 'flex' : 'none');

    initEditorButtonsHandlers(editorSettings);
  }

}

export function refreshRecordPreviews() {
  activateOriginalRecordPreview();
  activateTransliteratedRecordPreview();
}



export async function showWarnings() {

  try {
    const warnings = await dbGetRecordNote('transliteratedRecordWarnings');
    warnings.forEach(warning => {
      handleWarning(warning);
    })
  } catch (error) {
    showSnackbar({style: 'alert', text: 'Valitettavasti translitteroidun tietueen virheitä ei voida näyttää'});
    console.log('Error while trying to get transliterated record warnings from database and show it', error);
  }

}

export async function showChanges(transliteratedRecord) {

  if (!transliteratedRecord) {
    return;
  }

  try {
    const changeReports = await dbGetRecordNote('transliteratedRecordChanges');
    changeReports.forEach(report => {
      handleChangeReport(report);
    })
  } catch (error) {
    showSnackbar({style: 'alert', text: 'Valitettavasti translitteroidun tietueen muutoksia ei voida näyttää'});
    console.log('Error while trying to get transliterated record changes from database and show it', error);
  }

}


/*****************************************************************************/

function handleWarning(warning) {

  if (!warning) {
    return;
  }

  showSnackbar({style: 'info', text: `${warning}`});
}

function handleChangeReport(report) {

  if (!report) {
    return;
  }

  const fieldId = report.uuid;
  const row = document.querySelector(`div#transliteratedRecordPanel div.row[id='${fieldId}']`)

  if (!row) {
    return;
  }

  if (report.change === 'add') {
    row.classList.add('added');
  }

  if (report.change === 'edit') {
    row.classList.add('edited');
  }

  if (report.change === 'delete') {
    row.classList.add('deleted');
  }

}
