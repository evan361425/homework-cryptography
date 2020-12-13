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

module.exports = { joinPath, readFile, writeFile };
