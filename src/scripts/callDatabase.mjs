/*****************************************************************************/
/* CYRILLUX: BROWSER INDEXED DB                                              */
/* - This application utilises the idb library:                              */
/*     https://github.com/jakearchibald/idb                                  */
/*****************************************************************************/

/* External module imports */
import {openDB, deleteDB} from '/external/modules/idb';

/* Shared imports */
import {showSnackbar} from '/shared/scripts/snackbar.js';


/*****************************************************************************/
/* idb variables for Cyrillux */
const dbName = 'cyrilluxDatabase';
const dbVersion = 1;
const dbStores = [
  'originalRecordStore',
  'recordNoteStore',
  'savedRecordsStore',
  'sourceRecordsStore',
  'transliteratedRecordStore'
];


/* Open and upgrade database */
/*****************************************************************************/
const dbPromise = openDB(dbName, dbVersion, {
  upgrade(db) {
    dbStores.forEach(store => {
      db.createObjectStore(store);
    });
  }
});


/*****************************************************************************/
/* Delete database */

export async function deleteIdb() {
  return await deleteDB(dbName, {});
}


/*****************************************************************************/
/* Clear all database stores */

export async function dbClearAllStores() {
  await dbClearOriginalRecord();
  await dbClearRecordNotes();
  await dbClearSourceRecords();
  await dbClearTransliteratedRecord();
  await dbClearSavedRecords();
}


/*****************************************************************************/
/* Database operations for original source records */

export async function dbGetSourceRecord(key) {
  return (await dbPromise).get('sourceRecordsStore', key);
}

export async function dbSetSourceRecord(key, val) {
  return (await dbPromise).put('sourceRecordsStore', val, key);
}

export async function dbDelSourceRecord(key) {
  return (await dbPromise).delete('sourceRecordsStore', key);
}

export async function dbClearSourceRecords() {
  return (await dbPromise).clear('sourceRecordsStore');
}

export async function dbGetAllSourceRecordKeys() {
  return (await dbPromise).getAllKeys('sourceRecordsStore');
}

export async function dbGetAllSourceRecords() {
  return (await dbPromise).getAll('sourceRecordsStore');
}


/*****************************************************************************/
/* Database operations for original record */

export async function dbGetOriginalRecord() {
  return (await dbPromise).get('originalRecordStore', 'originalRecord');
}

export async function dbSetOriginalRecord(val) {
  return (await dbPromise).put('originalRecordStore', val, 'originalRecord');
}

export async function dbDelOriginalRecord() {
  return (await dbPromise).delete('originalRecordStore', 'originalRecord');
}

export async function dbClearOriginalRecord() {
  return (await dbPromise).clear('originalRecordStore');
}


/*****************************************************************************/
/* Database operations for transliterated record */

export async function dbGetTransliteratedRecord() {
  return (await dbPromise).get('transliteratedRecordStore', 'transliteratedRecord');
}

export async function dbSetTransliteratedRecord(val) {
  return (await dbPromise).put('transliteratedRecordStore', val, 'transliteratedRecord');
}

export async function dbDelTransliteratedRecord() {
  return (await dbPromise).delete('transliteratedRecordStore', 'transliteratedRecord');
}

export async function dbClearTransliteratedRecord() {
  return (await dbPromise).clear('transliteratedRecordStore');
}


/*****************************************************************************/
/* Database operations for transliterated saved records */

export async function dbGetSavedRecord(key) {
  return (await dbPromise).get('savedRecordsStore', key);
}

export async function dbSetSavedRecord(key, val) {
  return (await dbPromise).put('savedRecordsStore', val, key);
}

export async function dbDelSavedRecord(key) {
  return (await dbPromise).delete('savedRecordsStore', key);
}

export async function dbClearSavedRecords() {
  return (await dbPromise).clear('savedRecordsStore');
}

export async function dbGetAllSavedRecordKeys() {
  return (await dbPromise).getAllKeys('savedRecordsStore');
}


/* Database operations for additional record notes
/*****************************************************************************/
export async function dbGetRecordNote(key) {
  return (await dbPromise).get('recordNoteStore', key);
}

export async function dbSetRecordNote(key, val) {
  return (await dbPromise).put('recordNoteStore', val, key);
}

export async function dbDelRecordNote(key) {
  return (await dbPromise).delete('recordNoteStore', key);
}

export async function dbClearRecordNotes() {
  return (await dbPromise).clear('recordNoteStore');
}

/*
export async function dbGetAllRecordNoteKeys() {
  return (await dbPromise).getAllKeys('recordNoteStore');
}
*/

/*****************************************************************************/
/* function to check the status of user's indexedDB storage in browser */

export function doIndexedDbCheck() {

  /* Try opening a specific indexedDB in the browser storage with the name given as parameter */
  /* Note: no version checking at this point, just name check */
  const request = indexedDB.open(dbName);

  /* The indexedDB could not be opened. */
  /* The error is logged in console. */
  request.onerror = (event) => {
    console.error(`Error in opening indexedDB '${dbName}' version '${dbVersion}':`, event.target.error);
    console.log(`Note: IndexedDB can not be used in private browsing mode in Firefox or Edge`);
    showSnackbar({style: 'info', text: 'Note for Firefox and Edge users: Viewer features are not available in private browsing mode'});
  };

  /* The indexedDB was succesfully opened. */
  /* Start checking for deviations (caching only basic differences) */
  request.onsuccess = (event) => {
    let idbCheckPass = true;
    const idbFromBrowserStorage = event.target.result;
    const {version} = idbFromBrowserStorage;
    const storeNames = [...idbFromBrowserStorage.objectStoreNames];


    if (version !== dbVersion) {
      console.log('The idb version number does not match!');
      idbCheckPass = false;
    }

    if (storeNames.length !== dbStores.length) {
      console.log('The number of idb stores does not match!');
      idbCheckPass = false;
    }

    dbStores.sort();
    storeNames.sort();

    for (let i = 0; i < storeNames.length; i++) {
      if (storeNames[i] !== dbStores[i]) {
        console.log('The idb store names do not match!');
        idbCheckPass = false;
      }
    }

    if (idbCheckPass === false) {
      console.log('IndexedDB check failed!');
      deleteIdb();
      console.log('IndexedDB deleted => reloading page!');
      window.location.reload();
      return;
    }

    console.log(`IndexedDB OK! Using version '${version}' with stores '${storeNames}'`);
  };
}
