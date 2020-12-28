const { readFile, writeFile } = require('./helper');
const bigInt = require('big-integer');

/** @var {string} used folder */
const FOLDER = 'rsa-meet-in-middle-attack';
/** @var {string} file to p g h */
const DATA_PATH = `${FOLDER}/data.json`;
/** @var {string} file to output */
const OUTPUT_PATH = `${FOLDER}/result.json`;

describe('RSA Meet In Middle Attack', () => {
  let shouldPending = false;

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60 * 60 * 1000;
  });

  it('should found data file and set up correct', () => {
    const data = readFile(DATA_PATH);

    expect(data).toBeTruthy();
    expect(data.g).toBeTruthy();
    expect(data.h).toBeTruthy();
    expect(data.p).toBeTruthy();
    expect(data.keySize).toBeTruthy();
    shouldPending = false;
  });

  it('start!', async () => {
    const data = readFile(DATA_PATH);

    const attacker = new RsaMimAttack(data.g, data.h, data.p, data.keySize);
    const result = await attacker.attack();

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
});

/**
 * Basic Formula:
 * (generator ^ x) mod prime = hold
 * x = (DLog, base generator, of hold ) mod prime
 *
 * Meet In Middle
 * x = B * x0 + x1
 * B = (2 ^ lengh of key in bits) ^ 0.5
 * h = generator ^ x = g ^ (B * x0) * g ^ x1, in Z[p]
 * h / (g ^ x1) = g ^ (B * x0)
 *
 * Left side: h / (g ^ x1) = h * ((g ^ x1) ^ -1)
 * Right side: ((g ^ B) ^ x0)
 */
class RsaMimAttack {
  /**
   * @param {bigInt} generator
   * @param {bigInt} hold      generator ^ x = hold
   * @param {bigInt} prime     Z[p]
   * @param {bigInt} keySize
   */
  constructor(generator, hold, prime, keySize) {
    this.g = bigInt(generator);
    this.h = bigInt(hold);
    this.p = bigInt(prime);
    this.keySize = keySize;
    this.tableMax = bigInt(2).pow(this.keySize / 2).toJSNumber();
    this.consoleIter = Math.max(Math.floor(this.tableMax / 10), 2);
  }

  async attack() {
    const table = await this.buildTable();
    console.log(`\nRSA MIM Attack - Table Built!`);
    return await this.hitTable(table);
  }

  async buildTable() {
    const table = {};
    for (let x1 = 0; x1 <= this.tableMax; x1++) {
      if (x1 % this.consoleIter === 0) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`RSA MIM Attack - table: ${(x1 / this.tableMax * 100).toFixed(0)}%`);
      }
      table[this.h.multiply(
        this.g.modPow(x1, this.p).modInv(this.p),
      ).mod(this.p)] = x1;
    }
    return table;
  }

  async hitTable(table) {
    const base = this.g.modPow(this.tableMax, this.p);
    for (let x0 = 0; x0 <= this.tableMax; x0++) {
      if (x0 % this.consoleIter === 0) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`RSA MIM Attack - hit: ${(x0 / this.tableMax * 100).toFixed(0)}%`);
      }
      if (table[base.modPow(x0, this.p)]) {
        console.log(`Hit at x0: ${x0}, x1: ${table[base.modPow(x0, this.p)]}`);
        return this.getXByX0X1(x0, table[base.modPow(x0, this.p)]);
      }
    }
  }

  getXByX0X1(x0, x1) {
    return bigInt(x0).multiply(this.tableMax).plus(x1);
  }
}
