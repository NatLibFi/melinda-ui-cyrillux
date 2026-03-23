/************************************************************************************/
/* TRANSLITERATE MARC RECORDS USING SELECTED STANDARDS (+ APPLY VARIOUS VALIDATORS) */
/************************************************************************************/

/* External module imports */
import validateFactory from '@natlibfi/marc-record-validate';
import {MarcRecord} from '@natlibfi/marc-record';
import {
  AddMissingField336, AddMissingField337, AddMissingField338,
  Cyrillux, Fix33X, FixCountryCodes, FixLanguageCodes, FixRelatorTerms,
  IndicatorFixes, NormalizeQualifyingInformation, // , Punctuation2
  SyncLanguage
} from '@natlibfi/marc-record-validators-melinda';
import {createLogger} from '@natlibfi/melinda-backend-commons';
import {v4 as uuid} from 'uuid';

/* Local imports */
import {checkForWarnings} from './checkForWarnings.js';
import {removeFailedTransliterations} from './removeFailedTransliterations.js';

/*****************************************************************************/

export function createTransliterationService() {
  const logger = createLogger();

  return {transliterate};

  async function transliterate(record, options) {
    logger.debug('TRANSLITERATION SERVICE: transliterate');
    logger.info('Converting cyrillic content to ISO-9 and add 880$6 links');

    const defaultOptions = {
      doISO9Transliteration: true,
      doSFS4900Transliteration: true,
      preferSFS4900: false,
      tagPattern: "^(?:[12345678][0-8][0-8]|490)$" // Skip 0XX and 5XX here. Note, that even though not blocked here, 648...688 probably should not be transliterated either!
    };

    const originalRecord = new MarcRecord(record, {subfieldValues: false});

    const cyrilluxOptions = {
      doISO9Transliteration: options && typeof options.doISO9Transliteration === 'boolean'
        ? options.doISO9Transliteration
        : defaultOptions.doISO9Transliteration,
      doSFS4900Transliteration: options && typeof options.doSFS4900Transliteration === 'boolean'
        ? options.doSFS4900Transliteration
        : defaultOptions.doSFS4900Transliteration,
      preferSFS4900: options && typeof options.preferSFS4900 === 'boolean'
        ? options.preferSFS4900
        : defaultOptions.preferSFS4900,
      // Tag pattern lists tags that can be translitterated. If undefined, all fields can be transliterated.
      // Note that 336, 337, 338 and especially 880 are hard-coded in the validator/fixer as non-transliterable!
      tagPattern: options && typeof options.tagPattern === 'string'
        ? options.tagPattern
        : defaultOptions.tagPattern
    };

    const validationOptions = {
      fix: true,
      validateFixes: true
    };

    // Some general validators and Cyrillux validator are used.
    // Omitting usemarcon-cyrillix-specific stuff for now.
    // Note that Cyrillux validator calls validator(s) sortFields() as well!
    const validators = [
      FixCountryCodes(),
      FixLanguageCodes(),
      SyncLanguage(), // 008/35-37 <=> 041$a (or $d)
      FixRelatorTerms(),
      NormalizeQualifyingInformation(),
      Fix33X(),
      AddMissingField336(),
      AddMissingField337(),
      AddMissingField338(),
      IndicatorFixes(),
      //Punctuation2(), // mainly non-ending punctuation, remove punctuation fixes as punctuation rules are crappy with non-latin (here: cyrillic) letters.
      //CyrilluxUsemarconReplacement(), // Currently we don't want to use this!
      Cyrillux(cyrilluxOptions) // The main validator for Cyrillux. 
    ];

    const validate = validateFactory(validators);
    const result = await validate(record, validationOptions);

    result.warnings = checkForWarnings(originalRecord, result.record);
    result.record.fields = removeFailedTransliterations(result.record.fields);

    result.record.fields.forEach(field => {
      if (field.uuid === undefined) {
        field.uuid = uuid();
      }
    });

    return result;
  }

}
