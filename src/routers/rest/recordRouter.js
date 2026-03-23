/*****************************************************************************/
/* ROUTE REQUESTS TO SERVICES                                                */
/*****************************************************************************/

/* External module imports */
import {Router} from 'express';
import {createLogger} from '@natlibfi/melinda-backend-commons';

/* Local imports */
import {createMarcRecordSerializationService, createMarcRecordValidationService, createMelindaApiService, createSruService, createTransliterationService} from '../../services/services.js';
import {handleError, handleFailedRouteParams, handleFailedQueryParams, handleFile} from '../routerUtils/routerUtils.js';

/*****************************************************************************/

export function createRecordRouter(melindaApiOptions, sruApiOptions) {
  const logger = createLogger();

  const marcRecordSerializationService = createMarcRecordSerializationService();
  const marcRecordValidationService = createMarcRecordValidationService();
  const melindaApiService = createMelindaApiService(melindaApiOptions);
  const sruService = createSruService(sruApiOptions);
  const transliterationService = createTransliterationService();


  return new Router()
    .use(handleFailedQueryParams)
    .get('/fetch/:id', handleFailedRouteParams, fetchRecord)
    .post('/add', handleFailedRouteParams, addRecord) // add to indexedDB
    .post('/check', handleFailedRouteParams, checkRecord)
    .post('/serialize', handleFailedRouteParams, handleFile, convertFileToMarcRecords)
    .post('/transliterate', handleFailedRouteParams, transliterateRecord)
    .post('/fix', handleFailedRouteParams, applyFixers) // apply selected fixers from melinda-marc-record-validators
    .post('/update/:id', handleFailedRouteParams, updateRecord)
    .use(handleError);


  async function fetchRecord(req, res, next) {
    logger.debug('GET: fetchRecord');
    const {id} = req.params;

    logger.verbose(`Fetching record with Melinda ID '${id}'`);

    try {
      const result = await sruService.getRecordsById(id);
      res.json(result);
    } catch (error) {
      return next(error);
    }
  }


  async function addRecord(req, res, next) {
    logger.debug('POST: addRecord');

    const record = req.body;
    const cataloger = req.user.id;

    logger.verbose(`Adding article record with cataloger ${cataloger}: ${JSON.stringify(record)}`);

    try {
      const result = await melindaApiService.createRecord(record, cataloger);
      res.json(result);
    } catch (error) {
      return next(error);
    }

  }


  async function checkRecord(req, res, next) {
    logger.debug('POST: checkRecord');

    const record = req.body;
    const id = record.melindaId;
    const cataloger = req.user.id;

    logger.verbose(`Checking article record: ${JSON.stringify(record)}`);

    try {
      const result = id
        ? await melindaApiService.validateRecordForUpdate(id, record, cataloger)
        : await melindaApiService.validateRecordForCreation(record, cataloger);

      res.json(result);
    } catch (error) {
      return next(error);
    }
  }


  async function convertFileToMarcRecords(req, res, next) {
    logger.debug('POST: convertFileToMarcRecords');

    const fileContent = req.file.buffer;
    const fileName = req.file.originalname;
    const fileType = fileName.substring(fileName.lastIndexOf('.') + 1);

    logger.verbose(`Converting file to MARC records: ${fileName}`);

    try {
      const result = await marcRecordSerializationService.serialize(fileContent, fileType);
      res.json(result);
    } catch (error) {
      return next(error);
    }

  }


  async function applyFixers(req, res, next) {
    logger.debug('POST: applyFixers');

    const record = req.body;

    logger.verbose(`Applying fixers to Melinda record: ${JSON.stringify(record)}`);

    try {
      const result = await marcRecordValidationService.fixAndValidateRecord(record);
      res.json(result);
    } catch (error) {
      return next(error);
    }

  }

  async function transliterateRecord(req, res, next) {
    logger.debug('POST: transliterateRecord)');

    const {record, standards} = req.body;

    const options = {
      doISO9Transliteration: standards.includes('iso9'),
      doSFS4900Transliteration: standards.includes('sfs4900'),
      preferSFS4900: standards.includes('preferSFS4900')
    };

    logger.verbose(`Transliterating record with id ${JSON.stringify(record.id)} using standards: ${JSON.stringify(options)}`);

    try {
      const result = await transliterationService.transliterate(record, options);
      res.json(result);
    } catch (error) {
      return next(error);
    }
  }

  async function updateRecord(req, res, next) {
    logger.debug('POST: updateRecord');

    const {id} = req.params;
    const record = req.body;
    const cataloger = req.user.id;

    logger.verbose(`Updating article record with Melinda ID ${id} and cataloger ${cataloger}: ${JSON.stringify(record)}`);

    try {
      const result = await melindaApiService.updateRecord(id, record, cataloger);
      res.json(result);
    } catch (error) {
      return next(error);
    }

  }

}
