const path = require('path');
const fs = require('fs');

function joinPath(fileName) {
  return path.join(__dirname, '../data', fileName);
}

function readFile(fileName) {
  fileName = joinPath(fileName);

  if (!fs.existsSync(fileName)) {
    return pending(`Can't find file ${fileName}`);
  }

  const raw = fs.readFileSync(fileName).toString();

  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`${fileName} must contain JSON formated data`);
  }
}

function writeFile(fileName, data) {
  fileName = path.join(__dirname, '../data', fileName);
  fs.writeFileSync(fileName, JSON.stringify(data));
}

/**
 * Replace substring from start to replacement length
 * @param  {string} origin      original string
 * @param  {string} replacement replacement
 * @param  {int} startFrom      default is replace to last char
 * @return {string}             new string
 */
function strReplace(origin, replacement, startFrom) {
  if (startFrom === undefined) {
    startFrom = origin.length - replacement.length;
  }

  return origin.slice(0, startFrom) +
    replacement +
    origin.slice(startFrom + replacement.length);
}

class HexStr {
  constructor(value) {
    this.value = value;
    this.num = this.toNumber();
  }

  toArray() {
    const result = this.value.match(/.{2}/g);
    return result === null ? [] : result;
  }

  toNumber() {
    return this.toArray().map((hex) => parseInt(hex, 16));
  }

  toChar() {
    return this.num.map((num) => String.fromCharCode(num));
  }

  xorWith(strOrHex) {
    // check if is number
    if (strOrHex.toFixed) {
      strOrHex = strOrHex.toHex();
    }
    // check is HexStr or String
    const nums = (typeof strOrHex === 'string' || strOrHex instanceof String) ?
      strOrHex.toHex().num :
      strOrHex.num;

    return this.num
      .map((num1, i) => nums[i] === undefined ? null : num1 ^ nums[i])
      .filter((el) => el !== null)
      .map((num) => num.toHex())
      .join('');
  }
}

/* eslint-disable */
String.prototype.toHex = function(index) {
  if (index === undefined) {
    return new HexStr(this);
  }
  const char = (new HexStr(this)).toArray()[index];
  return char ? new HexStr(char) : new HexStr('');
};
Number.prototype.toHex = function() {
  return this.toString(16).padStart(2, '0');
};
/* eslint-enable */

module.exports = { joinPath, readFile, writeFile, strReplace, HexStr };
