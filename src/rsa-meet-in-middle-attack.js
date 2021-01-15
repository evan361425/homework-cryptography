const { readFile, writeFile } = require('./helper');
const bigInt = require('big-integer');
const workerpool = require('workerpool');

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
   * @param {int|string} generator
   * @param {int|string} hold      generator ^ x = hold
   * @param {int|string} prime     Z[p]
   * @param {int} keySize
   */
  constructor(generator, hold, prime, keySize) {
    this.g = generator;
    this.h = hold;
    this.p = prime;
    this.tableMax = Math.pow(2, +keySize / 2);
    this.consoleIter = Math.max(Math.floor(this.tableMax / 10), 2);
    this.pool = workerpool.pool(`${__dirname}/worker/${FOLDER}.js`);
  }

  async attack() {
    try {
      const table = await this.buildTable();
      console.log(`\nRSA MIM Attack - Table Built!`);
      return await this.hitTable(table);
    } catch (e) {
      this.pool.terminate();
    }
  }

  buildTable() {
    return new Promise((resolve, reject) => {
      const table = {};
      const promises = Array.from({ length: this.tableMax + 1 }, (_, x1) => {
        return this.pool
          .exec('buildTable', [x1, this.g, this.h, this.p])
          .then((result) => {
            this.print('table', x1);
            table[result] = x1;
          })
          .catch(reject);
      });

      Promise.all(promises).then(() => resolve(table));
    });
  }

  async hitTable(table) {
    const base = bigInt(this.g).modPow(this.tableMax, this.p).toString();
    return new Promise((resolve, reject) => {
      Array.from({ length: this.tableMax + 1 }, (_, x0) => {
        return this.pool
          .exec('hitTable', [x0, base, this.p])
          .then((result) => {
            if (table[result]) {
              resolve(this.getXByX0X1(x0, table[result]));
              this.pool.terminate(true);
            }
          })
          .catch(reject);
      });
    });
  }

  getXByX0X1(x0, x1) {
    return bigInt(x0).multiply(this.tableMax).plus(x1);
  }

  print(prefix, x) {
    x = +x;
    if (x % this.consoleIter === 0) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`RSA MIM Attack - ${prefix}: ${(x / this.tableMax * 100).toFixed(0)}%`);
    }
  }
}
