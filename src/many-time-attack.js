const path = require('path');
const fs = require('fs');

/** @var {string} file to cypher text */
const filePath = '../data/many-time-attack/cyphertexts.txt';
/** @var {number} rate to consider space */
const matchedRate = 0.7;

describe('Many time attack', () => {
  it('get cypher text', () => {
    const cyphers = getCypherTextFromFile(filePath);
    expect(cyphers).toHaveSize(10);
  });

  it('attack unkown cypher', () => {
    const unknownCypher = '32510ba9babebbbefd001547a810e67149caee11d945cd7fc81a05e9f85aac650e9052ba6a8cd8257bf14d13e6f0a803b54fde9e77472dbff89d71b57bddef121336cb85ccb8f3315f4b52e301d16e9f52f904';

    const cyphers = getCypherTextFromFile(filePath);
    const secretKey = getSecretKeyByManyTimeAttack(cyphers);

    let guessPlainText = xorHexStringToChar(unknownCypher, secretKey);
    guessPlainText = replaceUnalphaToStar(guessPlainText);
    console.log(`\nguessing plain text is:\n${guessPlainText}`);
    expect(guessPlainText).toBeTruthy();
  });
});

/**
 * Get possibly space in cypher from {countCharAfterXorEachCypher},
 * If c is space, p is plain text of c, k is key:
 * c XOR space = p XOR k XOR space = k
 *
 * But if two p[1], p[2] are both space
 * c[1] XOR c[2] = 0
 * So need {matchedThreshold},
 *
 * Finally padding zero if can't find key.
 *
 * @see {@link countCharAfterXorEachCypher}
 * @param  {[type]} cyphers [description]
 * @return {[type]}         [description]
 */
function getSecretKeyByManyTimeAttack(cyphers) {
  let xoredText;
  const guessSecretKey = {};
  const matchedThreshold = cyphers.length * matchedRate;
  cyphers.forEach(cypher => {
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
 * @return void
 */
function countCharAfterXorEachCypher(counter, cypher, cyphers) {
  cyphers
    .filter(c => c !== cypher)
    .forEach((c, index) => {
      xoredStr = xorHexStringToChar(c, cypher);
      for (let index = 0, length = xoredStr.length; index < length; index++) {
        if (charCodeIsAlpha(xoredStr.charCodeAt(index))) {
          counter[index] = counter[index] ? counter[index] + 1 : 1;
        }
      }
    });
}

function getCypherTextFromFile(fileName) {
  fileName = path.join(__dirname, fileName);
  const text = fs.readFileSync(fileName).toString();
  return text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);
}

/**
 * Replace substring from start to replacement length
 * @param  {string} str     original string
 * @param  {string} replace replacement
 * @param  {int} start      start to replace
 * @return {string}         new string
 */
function strReplace(str, replace, start) {
  return str.slice(0, start) + replace + str.slice(start + replace.length);
}

function xorStrWithSpaceToChar(str) {
  const spaces = '20'.repeat(str.length / 2);
  return xorHexStringToChar(str, spaces);
}

function charCodeIsAlpha(code) {
  return (code > 64 && code < 91) || // A-Z
    (code > 96 && code < 123); // a-z
}

function xorHexStringToChar(str1, str2) {
  const maxLength = Math.min(str1.length, str2.length);
  let num1, num2, result = '';
  for (let charIndex = 0; charIndex < maxLength; charIndex += 2) {
    num1 = hexToNumber(str1[charIndex] + str1[charIndex+1]);
    num2 = hexToNumber(str2[charIndex] + str2[charIndex+1]);
    result += String.fromCharCode(num1 ^ num2);
  }
  return result;
}

function charToHex(str) {
  return str.charCodeAt(0).toString(16);
}

function hexToNumber(str) {
  return parseInt(str, 16);
}

function replaceUnalphaToStar(str) {
  for(let i = 0, length = str.length; i < length; i++) {
    // not alpha and also not white space
    if (!charCodeIsAlpha(str.charCodeAt(i)) && str.charCodeAt(i) !== 32) {
      str = strReplace(str, '*', i);
    }
  }
  return str;
}
