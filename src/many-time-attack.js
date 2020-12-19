const { readFile, writeFile, strReplace } = require('./helper');

/** @var {string} used folder */
const FOLDER = 'many-time-attack';
/** @var {string} file to training cypher text */
const TRAIN_PATH = `${FOLDER}/train.json`;
/** @var {string} file to testing cypher text */
const TEST_PATH = `${FOLDER}/test.json`;
/** @var {string} file to output */
const OUTPUT_PATH = `${FOLDER}/result.json`;
/** @var {number} rate to consider space */
const MATCHED_RATE = 0.7;

describe('Many Time Attack', () => {
  let shouldPending = false;

  it('should contain at least 10 cyphers to correctly find key', () => {
    const cyphers = readFile(TRAIN_PATH);

    expect(cyphers.length).toBeGreaterThan(9);
    shouldPending = false;
  });

  it('should contain at least 1 testing cypher', () => {
    const cyphers = readFile(TEST_PATH);

    expect(cyphers.length).toBeGreaterThan(0);
    shouldPending = false;
  });

  it('start running', async () => {
    const cyphers = readFile(TRAIN_PATH);
    const testing = readFile(TEST_PATH);

    const secretKey = await getSecretKeyByManyTimeAttack(cyphers);

    const guessResult = testing.map((testCypher) =>
      replaceUnalphaToStar(testCypher.toHex().xorWith(secretKey)),
    );

    console.log(`Found decrypted plain text:\n${guessResult}`);
    writeFile(OUTPUT_PATH, guessResult);
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
      console.log(`\nFound guessing cypher:\n${result}`);
    }
  });
});

/**
 * Get possibly space in cypher from {@link countCharAfterXorEachCypher},
 * If c is space, p is plain text of c, k is key:
 * c XOR space = p XOR k XOR space = k
 *
 * But if two p[1], p[2] are both space
 * c[1] XOR c[2] = 0
 * So need {@link matchedThreshold},
 *
 * Finally padding zero if can't find key.
 *
 * @param  {array} cyphers
 * @return {string}
 */
async function getSecretKeyByManyTimeAttack(cyphers) {
  const guessSecretKey = {};
  const matchedThreshold = cyphers.length * MATCHED_RATE;
  cyphers.forEach((cypher) => {
    const charCounter = countCharAfterXorEachCypher(cypher, cyphers);
    const cypherWithSpace = cypher.toHex()
      .xorWith('20'.repeat(cypher.length / 2))
      .toHex()
      .num;

    for (const [position, count] of Object.entries(charCounter)) {
      if (count >= matchedThreshold) {
        guessSecretKey[position] = cypherWithSpace[position];
      }
    }
  });

  let keyWithUnknown = '00'.repeat(150);
  for (const [position, value] of Object.entries(guessSecretKey)) {
    keyWithUnknown = strReplace(
      keyWithUnknown,
      value.toString(16).padStart(2, '0'),
      position * 2,
    );
  }

  return keyWithUnknown;
}

/**
 * If XOR two cypher: c[1] XOR c[2] = p[1] XOR k XOR p[2] XOR k = p[1] XOR p[2]
 *
 * If p[1] XOR p[2] is in alphabet, it might be one is space other is charater.
 * After XOR many cypher with specific cypher and get alphabet many times,
 * we can say that this position of cypher might be a space, and other is the text after we XOR.
 *
 * @param  {string} cypher  cypher we want to test
 * @param  {array} cyphers other cypher to XOR
 * @return {void}
 */
function countCharAfterXorEachCypher(cypher, cyphers) {
  const counter = {};
  const cypherHex = cypher.toHex();

  cyphers
    .filter((c) => c !== cypher)
    .forEach((c, index) => {
      cypherHex.xorWith(c).toHex().num
        .forEach((charCode, index) => {
          if (charCodeIsAlpha(charCode)) {
            counter[index] = counter[index] ? counter[index] + 1 : 1;
          }
        });
    });

  return counter;
}

function charCodeIsAlpha(code) {
  return (code > 64 && code < 91) || // A-Z
    (code > 96 && code < 123); // a-z
}

function replaceUnalphaToStar(str) {
  const hex = str.toHex();
  const rawStr = hex.toChar();

  return hex.num.map((charCode, index) =>
    charCodeIsAlpha(charCode) || charCode === 32 ?
      rawStr[index] :
      '*',
  ).join('');
}
