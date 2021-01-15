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

class HexStr {
  constructor(value) {
    // is number
    if (value.toFixed) {
      value = value.toString(16).padStart(2, '0');
    }
    this.value = value;
  }

  toNumber() {
    return this.toArray().map((hex) => parseInt(hex, 16));
  }

  toChar() {
    return this.toNumber().map((num) => String.fromCharCode(num));
  }

  toArray() {
    const result = this.value.match(/.{2}/g);
    return result === null ? [] : result;
  }

  xorWith(strOrHex) {
    // check is HexStr or String
    const nums = (strOrHex instanceof HexStr) ?
      strOrHex.toNumber() :
      HexStr.instance(strOrHex).toNumber();

    const result = this.toNumber()
      .map((num1, i) => nums[i] === undefined ? null : num1 ^ nums[i])
      .filter((el) => el !== null)
      .map((num) => num.toString(16).padStart(2, '0'))
      .join('');

    return HexStr.instance(result);
  }

  static instance(hex) {
    return new HexStr(hex);
  }
}

module.exports = { joinPath, readFile, writeFile, HexStr };
