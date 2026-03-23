/* External module imports */
//import _ from 'lodash';

/* Local imports */
import {fieldContainsCyrillicCharacters} from './transliterationUtils.js';
import {fieldHasSubfield} from '@natlibfi/marc-record-validators-melinda/dist/utils.js';

/*****************************************************************************/

export function removeFailedTransliterations(fieldList) {
  return fieldList
    .filter(field => {
      const failedSFS4900Transliteration = fieldHasSubfield(field, '9', 'SFS4900 <TRANS>') && fieldContainsCyrillicCharacters(field);
      return !failedSFS4900Transliteration;
    });

}


/*****************************************************************************/




