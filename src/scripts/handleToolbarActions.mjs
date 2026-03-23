/*****************************************************************************/
/* CYRILLUX: TOOLBAR ACTIONS                                                 */
/*****************************************************************************/

/* Local imports */
import {handleStandardChange} from '/scripts/configureRecord.mjs';
import {handleFileChange, importRecord} from '/scripts/importRecord.mjs';
import {searchRecord} from '/scripts/searchRecord.mjs';
import {resetApp, resetPreview} from '/scripts/updateView.mjs';

/* Shared imports */
import {getAllToolbarDropdowns} from '/shared/scripts/toolbar.js';
import {eventHandled} from '/shared/scripts/uiUtils.js';

/*****************************************************************************/


export function addDropdownEventListeners() {
  addDropdownIsOpenedEventListeners();
  addDropdownDoActionEventListeners();
}

/*****************************************************************************/


function addDropdownIsOpenedEventListeners() {
  const toolbarDropdowns = getAllToolbarDropdowns();

  toolbarDropdowns.forEach(dropdown => {

    dropdown.addEventListener('dropdownOpened', event => {
      eventHandled(event);

      if (dropdown.id === 'recordSearchDropdown') {
        const recordSearchInput = dropdown.querySelector('input');

        if (recordSearchInput.value === '') {
          recordSearchInput.focus();
        }
      }

      if (dropdown.id === 'recordImportDropdown') {
        const recordImportButton = dropdown.querySelector('#recordImportButton');
        const selectedRecordTag = dropdown.querySelector('.tag-wrapper.selected');

        selectedRecordTag ? selectedRecordTag.focus() : recordImportButton.focus();
      }

      if (dropdown.id === 'recordConfigureDropdown') {
        //add focus for a standard selection ?
      }

    })
  })

}

function addDropdownDoActionEventListeners() {
  addSearchRecordEventListener();
  addImportRecordEventListener();
  addFileChangedEventListener();
  addStandardChangedEventListeners();
  addResetViewEventListeners();
}

/*****************************************************************************/


function addSearchRecordEventListener() {
  const recordSearchInput = document.getElementById('recordSearchInput');
  const recordSearchButton = document.getElementById('recordSearchButton');

  recordSearchInput.addEventListener('keydown', event => {

    if (event.code === 'Enter' || event.code === 'NumpadEnter') {
      eventHandled(event);
      recordSearchButton.click();
    }

  })


  recordSearchButton.addEventListener('click', event => {
    eventHandled(event);
    searchRecord();
  })

}

function addImportRecordEventListener() {
  const recordImportButton = document.getElementById('recordImportButton');

  recordImportButton.addEventListener('click', event => {
    eventHandled(event);
    importRecord();
  })

}

function addFileChangedEventListener() {
  const hiddenFileInput = document.getElementById('hiddenFileInput');

  hiddenFileInput.addEventListener('change', event => {
    eventHandled(event);
    handleFileChange();
  })

}

function addStandardChangedEventListeners() {
  const standardCheckboxes = document.querySelectorAll('#recordConfigureDropdown input[type=checkbox]');

  standardCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', event => {
      eventHandled(event);
      handleStandardChange();
    })
  })
}

function addResetViewEventListeners() {
  const resetAppButton = document.getElementById('appResetButton');
  const resetPreviewButton = document.getElementById('previewResetButton');

  resetAppButton.addEventListener('click', event => {
    eventHandled(event);
    resetApp();
  })

  resetPreviewButton.addEventListener('click', event => {
    eventHandled(event);
    resetPreview();
  })

}
