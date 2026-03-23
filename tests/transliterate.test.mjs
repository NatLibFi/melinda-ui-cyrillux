import assert from 'node:assert/strict';
import {MarcRecord} from '@natlibfi/marc-record';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import {createTransliterationService} from '../src/services/transliterationServices/transliterationService.js';


generateTests({
  callback,
  path: [import.meta.dirname, '..', 'test-fixtures', 'transliterate'],
  useMetadataFile: true,
  recurse: false,
  fixura: {
    reader: READERS.JSON
  },
  hooks: {
    before: () => testValidatorFactory()
  }
});

async function testValidatorFactory() {
  const transliterationService = await createTransliterationService();

  assert.equal(typeof transliterationService, 'object');
  assert.equal(typeof transliterationService.transliterate, 'function');
}

async function callback({getFixture, fix = false, config = {}}) {
  //console.log(`CONF ${JSON.stringify(config)}`); // eslint-disable-line
  const transliterationService = await createTransliterationService(config);

  const record = new MarcRecord(getFixture('record.json'));
  //console.log(record);
  const expectedResult = getFixture('expectedResult.json');



  const result = await transliterationService.transliterate(record, config);
  removeUuids(result.record);

  assert.deepEqual(result.record, new MarcRecord(expectedResult));
  function removeUuids(record) {
    record.fields?.forEach(f => fieldRemoveUuids(f));

    function fieldRemoveUuids(field) {
      delete field.uuid;
      field.subfields?.forEach(sf => subfieldRemoveUuids(sf));
    }

    function subfieldRemoveUuids(subfield) {
      delete subfield.uuid;
    }
  }
}
