/*****************************************************************************/
/* FIX MARC RECORDS TO MELINDA RECORDS                                       */
/*****************************************************************************/

/* External module imports */
import {createLogger} from '@natlibfi/melinda-backend-commons';
import marcRecordValidate from '@natlibfi/marc-record-validate';

import {NormalizeUTF8Diacritics} from '@natlibfi/marc-record-validators-melinda';


/*****************************************************************************/

export function createMarcRecordValidationService() {
  const logger = createLogger();
  //const {default: validateFactory} = marcRecordValidate;
  const validateFactory = marcRecordValidate;

  return {fixAndValidateRecord};

  async function fixAndValidateRecord(record) {
    // These fixes are applied to the original record. However, I (NV) want to keep original "as is".
    logger.debug('MARC RECORD VALIDATOR SERVICE: fixAndValidateRecord');

    const options = {fix: true, validateFixes: true};
    // NV: Currently I want to keep the original record pretty much "as is"... transliterationService.js will use various validators on it's turn.
    const validators = [
      NormalizeUTF8Diacritics()
    ];

    const validate = validateFactory(validators);

    const result = await validate(record, options);
    return result;
  }

}