/*******************************************************************************/
/* SEARCH AND RETRIEVE RECORDS                                                 */
/*******************************************************************************/

/* External module imports */
import {createLogger} from '@natlibfi/melinda-backend-commons';
import natlibfiSruClient from '@natlibfi/sru-client';

/* Local imports */
import {createMarcRecordSerializationService} from '../services.js';


/*******************************************************************************/

export function createSruService(sruApiOptions) {
  const {sruApiUrl} = sruApiOptions;

  const logger = createLogger();
  const sruClient = getSruClient(sruApiUrl);

  return {getRecordsById};


  async function getRecordsById(id) {
    logger.debug(`SRU SERVICE: getRecordsById '${id}'`);

    const query = `rec.id=${id}`;

    const records = new Promise((resolve, reject) => {
      const marcRecordPromises = [];

      sruClient
        .searchRetrieve(query)
        .on('record', xmlString => {
          const marcRecord = getMarcRecord(xmlString);
          marcRecordPromises.push(marcRecord);
        })
        .on('end', async () => {
          const marcRecords = await Promise.all(marcRecordPromises);
          return resolve(marcRecords);
        })
        .on('error', error => {
          reject(error);
        });
    });

    return records;

  }


  /*******************************************************************************/

  function getSruClient(sruApiUrl) {
    //const {default: createSruClient} = natlibfiSruClient;
    const createSruClient = natlibfiSruClient;

    const sruClientOptions = {
      url: sruApiUrl,
      recordSchema: 'marcxml',
      retrieveAll: true
    };

    const sruClient = createSruClient(sruClientOptions);

    return sruClient;
  }

  async function getMarcRecord(xmlData) {
    const marcRecordService = createMarcRecordSerializationService();
    const [marcRecord] = await marcRecordService.serialize(xmlData, 'xml');

    return marcRecord;
  }

}
