/*****************************************************************************/
/* CYRILLUX: SHOW LIST FOR ORIGINAL AND TRANSLITERATED RECORDS               */
/*****************************************************************************/

/* Local imports */
import {removeRecordFromApp} from './updateView.mjs'; // Triggered when 'x' (=close record) is clicked
import {dbGetAllSavedRecordKeys, dbGetAllSourceRecordKeys, dbGetOriginalRecord, dbGetSavedRecord, dbGetSourceRecord} from '/scripts/callDatabase.mjs';
import {selectRecord} from '/scripts/selectRecord.mjs';

/* Shared imports */
import {startProcess, stopProcess} from '/shared/scripts/progressbar.js';
import {showSnackbar} from '/shared/scripts/snackbar.js';
import {eventHandled} from '/shared/scripts/uiUtils.js';


/*****************************************************************************/

export function refreshRecordListPanel() {
  updateSourceRecordList();
}


export function getRecordMelindaId(recordData) {
  const field001 = recordData.fields.find((field) => field.tag === '001');
  const melindaId = field001?.value;

  return melindaId;
}


function getRecordTitle(recordData) {
  const field245 = recordData.fields.find((field) => field.tag === '245');
  const subfieldA = field245?.subfields.find(subfield => subfield.code === 'a');
  const title = subfieldA?.value;

  return title;
}


export function formatMelindaId(melindaId) {
  const formattedMelindaId = melindaId ? `Melinda-ID: ${melindaId}` : 'Ei Melinda-ID:tä'

  return formattedMelindaId;
}


export function formatTitle(title) {
  const formattedTitle = title ? trimTitle(title) : 'Nimetön tietue'

  return formattedTitle;
}


/*****************************************************************************/


async function updateSourceRecordList() {
  startProcess();

  try {
    const sourceRecordIds = await dbGetAllSourceRecordKeys();
    createTags(sourceRecordIds, 'sourceRecordListPanel');
    updateAlreadySavedRecords();
    updateSelectedRecord();
  } catch (error) {
    showSnackbar({style: 'alert', text: 'Ongelma haettujen ja ladattujen tietueiden päivityksessä!'});
    console.log('Error while trying to update record list panel', error);
  } finally {
    stopProcess();
  }

}


/*****************************************************************************/


function createTags(recordIds, panelId) {
  const tagContainer = document.querySelector(`#${panelId} .record-list .tag-container`);

  tagContainer.replaceChildren();

  recordIds.forEach(recordId => {
    const tag = createRecordTag(recordId, panelId);
    tagContainer.append(tag);
  });
}


async function updateSelectedRecord() {

  try {
    const originalRecord = await dbGetOriginalRecord();
    const tag = document.getElementById(originalRecord?.id);
    selectRecordTag(tag);

  } catch (error) {
    showSnackbar({style: 'alert', text: 'Ongelma haettujen ja ladattujen tietueiden päivityksessä!'});
    console.log('Error while trying to update record list panel with selected record', error);
  }

}


async function updateAlreadySavedRecords() {

  try {
    const recordIds = await dbGetAllSavedRecordKeys();

    if (!recordIds) {
      return;
    }

    recordIds.forEach(async recordId => {

      const tag = getRecordTag(recordId);

      if (!tag) {
        return;
      }

      const melindaID = await dbGetSavedRecord(recordId);
      tag.title = `Tallennettu Melinda-ID:llä ${melindaID}`;

      tag.classList.add('success');

      if (tag.children.length > 1) { // close button is one, check mark is another
        return;
      }

      const spanElement = document.createElement('span');
      spanElement.classList.add('material-symbols-outlined', 'icon-check');
      spanElement.innerText = 'check';
      tag.appendChild(spanElement);
    })
  } catch (error) {
    console.log('Error in updating already saved records to record lists: ', error);
  }

}


function createRecordTag(recordId, panelId) {
  const tag = document.createElement('div');

  tag.id = recordId;
  tag.classList.add('tag-wrapper');
  tag.tabIndex = 0;
  addTagTextAndTitle(tag, recordId, panelId);
  addTagEventlisteners(tag, recordId, panelId);

  return tag;
}


async function addTagTextAndTitle(tag, recordId, panelId) {

  if (panelId === 'sourceRecordListPanel') {

    try {
      const recordData = await dbGetSourceRecord(recordId);
      addRecordDataToTag(tag, recordId, recordData);
    } catch (error) {
      showSnackbar({style: 'alert', text: 'Ongelma haettujen ja tuotujen tietueiden päivityksessä!'});
      console.log('Error while trying to get source record data', error);
    }

  }

}


function addTagEventlisteners(tag, recordId, panelId) {

  tag.addEventListener('keydown', event => {

    if (event.code === 'Enter' || event.code === 'NumpadEnter') {
      eventHandled(event);
      tag.click();
    }

  })

  tag.addEventListener('click', event => {
    eventHandled(event);
    selectRecordTag(tag);
    selectRecord(recordId, panelId);
  })

}

/*****************************************************************************/


function trimTitle(title) {
  const TRIM_PATTERN = '[?!.,(){}:;/ ]*';

  return title
    .replace(new RegExp(`^${TRIM_PATTERN}`, 'u'), '')
    .replace(new RegExp(`${TRIM_PATTERN}$`, 'u'), '');
}

function addCloseButtonToTag(tag, recordId) {
  const innerText = 'close';
  if (tag.children && tag.children.constructor === Array && tag.children.some(child => child.innerText === innerText)) { // No need to add
    return;
  }
  // Close-button:
  const spanElement = document.createElement('span');
  spanElement.classList.add('material-symbols-outlined', 'close-button', 'small', 'icon-only');
  spanElement.innerText = innerText;
  spanElement.title = 'sulje tietue';

  spanElement.addEventListener('keydown', event => {
    if (event.code === 'Enter' || event.code === 'NumpadEnter') {
      eventHandled(event);
      spanElement.click();
    }

  })

  spanElement.addEventListener('click', event => {
    eventHandled(event);

    removeRecordFromApp(recordId);

  })

  tag.appendChild(spanElement);


}

function addRecordDataToTag(tag, recordId, recordData) {
  const recordTitle = getRecordTitle(recordData)
  tag.innerText = formatTitle(recordTitle);
  const melindaId = getRecordMelindaId(recordData);
  tag.title = formatMelindaId(melindaId);

  addCloseButtonToTag(tag, recordId);
}

function getRecordTag(tagId) {
  const tag = document.querySelector(`.tag-container .tag-wrapper[id='${tagId}']`)
  return tag;
}


function selectRecordTag(tag) {

  if (!tag) {
    return;
  }

  unselectAllTags();
  tag.classList.add('selected');

}


function unselectAllTags() {
  const allSourceTags = document.querySelectorAll('#sourceRecordListPanel .tag-wrapper');

  allSourceTags.forEach(tag => {
    tag.classList.remove('selected');
  })

}