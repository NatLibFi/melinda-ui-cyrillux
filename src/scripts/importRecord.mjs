/*****************************************************************************/
/* CYRILLUX: IMPORT SOURCE RECORD                                            */
/*****************************************************************************/

/* Local imports */
import {refreshView} from '/scripts/updateView.mjs';
import {dbGetAllSourceRecords, dbSetSourceRecord} from '/scripts/callDatabase.mjs';
import {convertFileToMarcRecords} from '/scripts/callRest.mjs';
import {applyFixersToRecords} from '/scripts/convertRecord.mjs';
import {localIsDeletedRecord} from '/scripts/checkRecord.mjs';

/* Shared imports */
import {highlightElement} from '/shared/scripts/elements.js';
import {startProcess, stopProcess} from '/shared/scripts/progressbar.js';
import {showSnackbar} from '/shared/scripts/snackbar.js';

/* External module imports */
//import {v4 as uuid} from '/external/modules/uuid';
import {default as uuidTimestamp} from '/external/modules/uuid-timestamp';


/*****************************************************************************/


export function importRecord() {
  openFileBrowse();
}

export function handleFileChange() {
  const hiddenFileInput = document.getElementById('hiddenFileInput');
  const fileList = hiddenFileInput.files;

  if (fileList.length === 0) {
    console.log('No file selected');
    stopProcess();
    return;
  }

  Array.from(fileList).forEach(file => {
    showFile(file);
    checkFile(file);
    readFile(file);
  })

  resetRecordImportInput();
  resetHiddenFileInput();
};

export function resetRecordImportInput() {
  document.getElementById('recordImportInput').value = '';
}

export function resetHiddenFileInput() {
  document.getElementById('hiddenFileInput').value = '';
}

/*****************************************************************************/


function openFileBrowse() {
  const hiddenFileInput = document.getElementById('hiddenFileInput');
  hiddenFileInput.click();
};


function showFile(file) {
  const recordImportInput = document.getElementById('recordImportInput');

  recordImportInput.value = file.name;
};


function checkFile(file) {
  const recordImportInput = document.getElementById('recordImportInput');

  if (!file) {
    console.log('No file to check!');
    return;
  }

  if (file.size === 0) {
    console.log('File is empty!');
    highlightElement(recordImportInput, 'var(--color-functional-red)');
    showSnackbar({style: 'alert', text: 'Tyhjää tiedostoa ei voi avata, tarkista tiedoston sisältö!'});
    return;
  }

  if (!isJsonFile(file) && !isMrcFile(file)) {
    console.log(`File type is not accepted for upload!`);
    highlightElement(recordImportInput, 'var(--color-functional-red)');
    showSnackbar({style: 'alert', text: 'Vain .json- tai .mrc-tiedostot hyväksytään, tarkista tiedoston tyyppi!'});
    return;
  }

}

export async function importRecords(marcRecords, recordId = undefined) {
  const existingRecords = await dbGetAllSourceRecords();
  const recordImportInput = document.getElementById('recordImportInput');
  const importFromFile = recordId ? false : true;

  try {
    const melindaRecords = await applyFixersToRecords(marcRecords);

    const goodRecords = melindaRecords.filter(record => !localIsDeletedRecord(record));
    if (goodRecords.length === 0) {
      throw new Error('Deletoitu tietue!');
    }
    if (goodRecords.length < melindaRecords.length) {
      showSnackbar({style: 'error', text: 'Deletoituja tietueita ei otettu mukaan!'});
    }

    if (importFromFile) { // Having a recordId means that the record came thru a Melinda search (= is an existing record, not a new one)
      // Strip 001 and 003 before comparison:
      goodRecords.forEach(record => removeControlNumberAndControlNumberIdentifier(record));
    }

    const uniqueRecords = goodRecords.filter(record => isUniqueRecord(record, existingRecords));
    if (uniqueRecords.length === 0) {
      throw new Error('Duplikaatti!');
    }
    if (uniqueRecords.length < goodRecords.length) {
      showSnackbar({style: 'error', text: 'Duplikaatteja ei otettu mukaan!'});
    }

    saveRecordsToIndexedDb(uniqueRecords);
    if (importFromFile) {
      highlightElement(recordImportInput, 'var(--color-functional-green)');
    }
    refreshView();
  } catch (error) {
    const msg = error ? error : '<undefined error>';
    console.log('Error while reading file/processing record: ', msg);
    if (importFromFile) {
      highlightElement(recordImportInput, 'var(--color-functional-red)');
    }
    showSnackbar({style: 'error', text: `Tietueen lisäys ei onnistunut! ${msg}`});
  } finally {
    stopProcess();
  }

}

async function readFile(file) {
  startProcess();

  const recordImportInput = document.getElementById('recordImportInput');
  const fileFormData = new FormData();

  fileFormData.append('file', file, file.name);

  const existingRecords = await dbGetAllSourceRecords();

  let marcRecords;
  try {
    marcRecords = await convertFileToMarcRecords(fileFormData);
    if (marcRecords.length === 0) {
      throw new Error('Ei tietueita!');
    }
  }
  catch (error) {
    const msg = error ? error : '<undefined error>';
    console.log('Error while reading file/processing record: ', msg);
    highlightElement(recordImportInput, 'var(--color-functional-red)');
    showSnackbar({style: 'error', text: `Tiedoston avaus ei onnistunut! ${msg}`});
    stopProcess();
    return;
  }

  importRecords(marcRecords);

}

export function isUniqueRecord(newRecord, oldRecords) {
  const oldRecords2 = oldRecords.filter(oldRecord => oldRecord.leader === newRecord.leader);
  if (oldRecords2.length === 0) {
    return true;
  }

  //const newRecordFields = newRecord.fields.filter(field => field.tag !== '001' && field.tag !== '003');

  //console.log("COMPARE");
  //console.log(JSON.stringify(newRecord.fields));
  //console.log(JSON.stringify(oldRecords2[0].fields));

  if (oldRecords2.some(oldRecord => JSON.stringify(oldRecord.fields) === JSON.stringify(newRecord.fields))) {
    return false;
  }
  return true;
}

/*****************************************************************************/

function saveRecordsToIndexedDb(recordList) {
  recordList.forEach(record => {
    //const recordId = uuid();
    const recordId = uuidTimestamp.uuidEmit();
    record.id = recordId;
    //removeControlNumberAndControlNumberIdentifier(record); // Done at earlier stage for imports (and not done for Melinda records)
    console.log('Inserting record(s) into the database: ', record);
    dbSetSourceRecord(recordId, record);
  });
}

/*****************************************************************************/


function isJsonFile(file) {
  return file.type === 'application/json' || file.name.endsWith('.json');
}

function isMrcFile(file) {
  return file.name.endsWith('.mrc');
}

function removeControlNumberAndControlNumberIdentifier(record) {
  record.fields = record.fields.filter(field => field.tag !== '001' && field.tag !== '003');
  return record;
}

/*****************************************************************************/

