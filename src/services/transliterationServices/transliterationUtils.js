/* External module imports */
import XRegExp from 'xregexp';

/*****************************************************************************/


export function fieldContainsCyrillicCharacters(field) {
  return field.subfields && field.subfields.map(sub => sub.value).some(containsCyrillicCharacters);
}

export function fieldGetSubfield6Value(field) {
  const [sf6] = field.subfields.filter(sf => sf.code === '6');
  if (!sf6) {
    return '';
  }
  return sf6.value;
}

export function hasSubfieldValue(expectedCode, expectedValue) {
  const expectedSubfieldCodeStr = expectedCode.toString();
  return function (field) {
    return field.subfields && field.subfields.some(subfield => {
      return subfield.code === expectedSubfieldCodeStr && subfield.value === expectedValue;
    });
  };
}


export function isCyrillicCharacter(char) {
  return XRegExp('[\\p{Cyrillic}]').test(char);
}


/*****************************************************************************/

function containsCyrillicCharacters(str) {

  if (!str) {
    return false;
  }

  return str.split('').some(isCyrillicCharacter);
}