/*******************************************************************************/
/* SEARCH AND RETRIEVE RECORDS                                                 */
/*******************************************************************************/

/* External module imports */
import {createLogger} from '@natlibfi/melinda-backend-commons';
import {createMelindaApiRecordClient} from '@natlibfi/melinda-rest-api-client';


/*******************************************************************************/

export function createMelindaApiService(melindaApiOptions) {
  const logger = createLogger();
  const restApiRecordClient = createMelindaApiRecordClient(melindaApiOptions);

  return {createRecord, validateRecordForCreation, validateRecordForUpdate, updateRecord};

  async function createRecord(record, cataloger) {
    logger.debug('MELINDA API SERVICE: createRecord');
    const result = await restApiRecordClient.create(record, {noop: 0, cataloger: cataloger});
    return result;
  }

  async function updateRecord(id, record, cataloger) {
    logger.debug('MELINDA API SERVICE: updateRecord');
    const result = await restApiRecordClient.update(record, id, {noop: 0, cataloger: cataloger});
    return result;
  }

  async function validateRecordForCreation(record, cataloger) {
    logger.debug('MELINDA API SERVICE: validateRecordForCreation');
    const result = await restApiRecordClient.create(record, {noop: 1, cataloger: cataloger});
    return result;
  }

  async function validateRecordForUpdate(id, record, cataloger) {
    logger.debug('MELINDA API SERVICE: validateRecordForUpdate');
    const result = await restApiRecordClient.update(record, id, {noop: 1, cataloger: cataloger});
    return result;
  }

}
