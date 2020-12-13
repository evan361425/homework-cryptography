const path = require('path');
const fs = require('fs');

function joinPath(fileName) {
  return path.join(__dirname, '../data', fileName);
}

function readFile(fileName) {
  fileName = joinPath(fileName);
  const text = fs.readFileSync(fileName).toString();

  try {
    return JSON.parse(text);
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
 * @param  {string} str     original string
 * @param  {string} replace replacement
 * @param  {int} start      start to replace
 * @return {string}         new string
 */
function strReplace(str, replace, start) {
  return str.slice(0, start) + replace + str.slice(start + replace.length);
}

function xorHexStringToChar(str1, str2, toHex = false) {
  const maxLength = Math.min(str1.length, str2.length);
  let num1;
  let num2;
  let result = '';

  for (let charIndex = 0; charIndex < maxLength; charIndex += 2) {
    num1 = hexToNumber(str1[charIndex] + str1[charIndex+1]);
    num2 = hexToNumber(str2[charIndex] + str2[charIndex+1]);
    result += toHex ? numberToHex(num1 ^ num2) : String.fromCharCode(num1 ^ num2);
  }
  return result;
}

function hexToNumber(str) {
  return parseInt(str, 16);
}

function numberToHex(number) {
  return number.toString(16).padStart(2, '0');
}


module.exports = { joinPath, readFile, writeFile, strReplace, xorHexStringToChar, numberToHex, hexToNumber };
