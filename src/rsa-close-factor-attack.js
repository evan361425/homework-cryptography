const { readFile, writeFile } = require('./helper');
const bigInt = require('big-integer');

/** @var {string} used folder */
const FOLDER = 'rsa-close-factor-attack-attack';
/** @var {string} file to p g h */
const DATA_PATH = `${FOLDER}/data.json`;
/** @var {string} file to output */
const OUTPUT_PATH = `${FOLDER}/result.json`;

describe('RSA Meet In Middle Attack', () => {
  let shouldPending = false;

  it('should found data file and set up correct', () => {
    const data = readFile(DATA_PATH);

    expect(data).toBeTruthy();
    shouldPending = false;
  });

  it('start!', async () => {
    const data = readFile(DATA_PATH);

    writeFile(OUTPUT_PATH, result);
    console.log(`\nFound result:\n${result}`);
    shouldPending = false;
  });

  beforeEach(() => {
    if (shouldPending) {
      pending('you should handle up the environment');
    }
    shouldPending = true;
  });

  afterAll(() => {
    if (!shouldPending) {
      const result = readFile(OUTPUT_PATH);
      console.log(`\nFound plain text:\n${result}`);
    }
  });
});
