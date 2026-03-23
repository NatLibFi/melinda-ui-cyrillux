/*****************************************************************************/
/* CREATE MARC RECORDS FROM BUFFER DATA                                      */
/*****************************************************************************/

/* External module imports */
import httpStatus from 'http-status';
import {ISO2709, Json, MARCXML} from '@natlibfi/marc-record-serializers';
import {createLogger} from '@natlibfi/melinda-backend-commons';
import {Error} from '@natlibfi/melinda-commons';


/*****************************************************************************/

export function createMarcRecordSerializationService() {
  const logger = createLogger();

  return {serialize};

  async function serialize(data, type) {
    logger.debug('MARC RECORD SERIALIZATION SERVICE: serialize');

    if (type === 'mrc') {
      return convertIso2709ToMarcRecord(data);
    }

    if (type === 'json') {
      return convertJsonToMarcRecord(data);
    }

    if (type === 'xml') {
      return convertMarcxmlToMarcRecord(data);
    }

    throw new Error(httpStatus.BAD_REQUEST, 'Invalid data for serialization');


    async function convertIso2709ToMarcRecord(data) {
      logger.debug('MARC RECORD SERVICE: create MarcRecords from binary data');

      const parsedData = data
        .toString('utf8')
        .split('\x1D')
        .filter(splitData => splitData.trim() !== '');

      const marcRecords = parsedData
        .map(binaryDataItem => ISO2709.from(binaryDataItem));

      return marcRecords;
    }

    async function convertJsonToMarcRecord(data) {
      logger.debug('MARC RECORD SERVICE: create MarcRecords from JSON data');

      const parsedData = JSON.parse(data.toString('utf8'));

      const jsonArray = Array.isArray(parsedData)
        ? parsedData
        : [parsedData];

      const marcRecords = jsonArray
        .map(jsonDataItem => Json.from(JSON.stringify(jsonDataItem)));

      return marcRecords;
    }

    async function convertMarcxmlToMarcRecord(data) {
      logger.debug('MARC RECORD SERVICE: create MarcRecords from MARCXML data');

      const parsedData = data.toString('utf8');

      const xmlArray = Array.isArray(parsedData) ? parsedData : [parsedData];

      const marcRecords = xmlArray
        .map(xmlDataItem => MARCXML.from(xmlDataItem, {'subfieldValues': false}));

      return marcRecords;
    }

  }
}

