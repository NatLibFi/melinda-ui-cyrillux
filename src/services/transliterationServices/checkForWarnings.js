/* External module imports */
import XRegExp from 'xregexp';

/* Local imports */
import {fieldContainsCyrillicCharacters, fieldGetSubfield6Value, isCyrillicCharacter} from './transliterationUtils.js';

import {fieldGetUnambiguousOccurrenceNumber, fieldHasSubfield, fieldHasValidSubfield6, isSubfield6Pair, isValidSubfield6} from '@natlibfi/marc-record-validators-melinda';

/*****************************************************************************/

export function checkForWarnings(originalRecord, transformedRecord) {
  // check for mixed alphabets
  const mixedAlphabetsWarnings = transformedRecord.fields.reduce((acc, field) => {
    if (field.subfields) {
      const warnings = field.subfields
        .filter(subfield => isMixedAlphabet(subfield.value))
        .map(subfield => {
          const link = fieldGetSubfield6Value(field);
          return `Osakentässä ${field.tag}$${subfield.code} ($6=${link}) on sekä kyrillisiä että latinalaisia merkkejä.`;
        });
      return [...acc, ...warnings];
    }

    return acc;
  }, []);

  /*****************************************************************************/

  const brokenLinkWarnings = transformedRecord.fields
    .filter(field => fieldHasValidSubfield6(field))
    .filter(field => {
      const linkedField = transformedRecord.fields.find(otherField => isSubfield6Pair(field, otherField));
      return linkedField === undefined;
    }).map(field => {
      const subfield = field.subfields.find(sf => isValidSubfield6(sf));
      return `Kenttä ${field.tag} linkittää kenttään ${subfield.value}, jota ei ole olemassa.`;
    });


  const failedSFS4900TransliterationWarnings = transformedRecord.fields
    .filter(field => fieldHasSubfield(field, '9', 'SFS4900 <TRANS>') && fieldContainsCyrillicCharacters(field))
    .map(failedField => {
      const originalTag = fieldGetUnambiguousOccurrenceNumber(failedField) || '???';
      return `Alkuperäisen tietueen kentässä ${originalTag} on merkkejä, joita ei ole määritelty SFS4900-venäjä translitteroinnissa. SFS4900 kenttää ei luotu.`;
    });


  return [...mixedAlphabetsWarnings, ...brokenLinkWarnings, ...failedSFS4900TransliterationWarnings];
}

function isMixedAlphabet(str) {
  if (!str) {
    return false;
  }

  const hasCyrillic = str.split('').filter(isCharacter).some(isCyrillicCharacter);
  const hasOnlyCyrillic = str.split('').filter(isCharacter).every(isCyrillicCharacter);

  return (hasCyrillic && !hasOnlyCyrillic);
}

function isCharacter(char) {
  return XRegExp('[\\p{Cyrillic}|\\w]').test(char) && !/[0-9_]/.test(char);
}


