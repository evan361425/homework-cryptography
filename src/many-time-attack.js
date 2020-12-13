const { readFile, writeFile, strReplace, xorHexStringToChar } = require('./helper');

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

describe('Many time attack', () => {
  it('must contain enough data to decrypt', () => {
    const cyphers = readFile(TRAIN_PATH);

    expect(cyphers.length).toBeGreaterThan(9);
  });

  it('try decrypt testing cyphertext', () => {
    const testing = readFile(TEST_PATH);
    const cyphers = readFile(TRAIN_PATH);

    const secretKey = getSecretKeyByManyTimeAttack(cyphers);

    const guessResult = [];
    let guessPlainText;
    testing.forEach((testCypher) => {
      guessPlainText = xorHexStringToChar(testCypher, secretKey);
      guessResult.push(replaceUnalphaToStar(guessPlainText));
    });
    writeFile(OUTPUT_PATH, guessResult);

    expect(guessPlainText).toBeTruthy();
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
function getSecretKeyByManyTimeAttack(cyphers) {
  const guessSecretKey = {};
  const matchedThreshold = cyphers.length * MATCHED_RATE;
  cyphers.forEach((cypher) => {
    const charCounter = {};
    countCharAfterXorEachCypher(charCounter, cypher, cyphers);

    cypherWithSpace = xorStrWithSpaceToChar(cypher);
    for (const [position, count] of Object.entries(charCounter)) {
      if (count >= matchedThreshold) {
        guessSecretKey[position] = charToHex(cypherWithSpace.charAt(position));
      }
    }
  });

  let keyWithUnknown = '00'.repeat(150);
  for (const [position, value] of Object.entries(guessSecretKey)) {
    keyWithUnknown = strReplace(keyWithUnknown, value, position * 2);
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
 * @param  {object} counter record count on alpha in XORed string
 * @param  {string} cypher  cypher we want to test
 * @param  {array} cyphers other cypher to XOR
 * @return {void}
 */
function countCharAfterXorEachCypher(counter, cypher, cyphers) {
  cyphers
    .filter((c) => c !== cypher)
    .forEach((c, index) => {
      xoredStr = xorHexStringToChar(c, cypher);
      for (let index = 0, length = xoredStr.length; index < length; index++) {
        if (charCodeIsAlpha(xoredStr.charCodeAt(index))) {
          counter[index] = counter[index] ? counter[index] + 1 : 1;
        }
      }
    });
}

function xorStrWithSpaceToChar(str) {
  const spaces = '20'.repeat(str.length / 2);
  return xorHexStringToChar(str, spaces);
}

function charCodeIsAlpha(code) {
  return (code > 64 && code < 91) || // A-Z
    (code > 96 && code < 123); // a-z
}

function charToHex(str) {
  return str.charCodeAt(0).toString(16);
}

function replaceUnalphaToStar(str) {
  for (let i = 0, length = str.length; i < length; i++) {
    // not alpha and also not white space
    if (!charCodeIsAlpha(str.charCodeAt(i)) && str.charCodeAt(i) !== 32) {
      str = strReplace(str, '*', i);
    }
  }
  return str;
}
