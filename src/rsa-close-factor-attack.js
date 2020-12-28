const { readFile, writeFile } = require('./helper');
const bigInt = require('big-integer');

/** @var {string} used folder */
const FOLDER = 'rsa-close-factor-attack';
/** @var {string} file to p g h */
const DATA_PATH = `${FOLDER}/data.json`;
/** @var {string} file to output */
const OUTPUT_PATH = `${FOLDER}/result.json`;

describe('RSA Close Factor Attack', () => {
  let shouldPending = false;

  it('should found data file and set up correct', () => {
    const data = readFile(DATA_PATH);

    expect(data.every((item) => Boolean(item.N))).toBe(true);
    shouldPending = false;
  });

  it('start!', async () => {
    const data = readFile(DATA_PATH);

    const attacker = new ClossFactorAttack();
    const result = data.map((item) => {
      const smallFactor = attacker.attack(item.N, item.bound, item['3p+2q']);
      console.log(`\nFound one:\n${smallFactor}`);
      return smallFactor;
    });

    writeFile(OUTPUT_PATH, result);
    shouldPending = false;
  });

  beforeEach(() => {
    if (shouldPending) {
      pending('you should handle up the environment');
    }
    shouldPending = true;
  });
});

class ClossFactorAttack {
  attack(N, bound, is3pPlus2q) {
    N = bigInt(N);

    if (is3pPlus2q) {
      return this.avgIs3pPlus2q(N);
    } else {
      return this.avgIsPPlusQ(N, bound);
    }
  }

  avgIsPPlusQ(N, bound) {
    let i = 1;
    if (Array.isArray(bound)) {
      i = bound[0];
      bound = bound[1] ? bound[1] : bound[0];
    }

    const logRound = Math.max(100, Math.ceil(bound / 100));
    const sqaureRootN = squareRoot(N);

    for (; i <= bound; i++) {
      if (i % logRound === 0) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`RSA CF Attack - hit: ${(i / bound * 100).toFixed(0)}%`);
      }

      const avg = sqaureRootN.add(i);
      const offsetSquare = avg.pow(2).subtract(N);
      const offset = squareRoot(offsetSquare);
      if (offsetSquare.isDivisibleBy(offset)) {
        return avg.subtract(offset);
      }
    }

    return null;
  }

  /**
   * A = (3p + 2q)/2
   * A - (6N)^0.5 < 1/(8(6^0.5))
   * A = floor((6N)^0.5) + 0.5, since A is not integer
   * 3p*2q = (A + x)(A - x)
   * x = (A^2 - 6N)^0.5
   * A^2 = (floor((6N)^0.5))^2 + floor((6N)^0.5) + 0.25
   * x = SOME_INTEGER + 0.5
   * A + x = floor((6N)^0.5) + 0.5 + floor(x) + 0.5
   * A - x = floor((6N)^0.5) + 0.5 - floor(x) - 0.5
   *
   * @param  {bigInt} N N = p * q
   * @return {bigInt}
   */
  avgIs3pPlus2q(N) {
    const N6 = N.times(6);
    // squareRootN6 = floor((6N)^0.5)
    const squareRootN6 = squareRoot(N6);
    // squareOffset = squareRootN6^2 + squareRootN6 - 6N = A^2 - 6N - 0.25
    const squareOffset = squareRootN6.pow(2).plus(squareRootN6).subtract(N6);
    // offset = (A^2 - 6N - 0.25)^0.5 = SOME_INTEGER + 0.5 - 0.5
    const offset = squareRoot(squareOffset);
    // check who is even, if even divide it by 2!
    const dividor = squareRootN6.subtract(offset).isEven() ? 2 : 3;
    const factor1 = squareRootN6.subtract(offset).divide(dividor);
    const factor2 = squareRootN6.plus(offset).plus(1).divide(dividor === 2 ? 3 : 2);
    return factor1.lt(factor2) ? factor1 : factor2;
  }
}

// https://stackoverflow.com/questions/53683995/javascript-big-integer-square-root
function dynamicSquareRoot(value, x0) {
  const x1 = value.divide(x0).plus(x0).shiftRight(bigInt.one);
  if (x0.eq(x1) || x0.eq(x1.subtract(bigInt.one))) {
    return x0;
  }
  return dynamicSquareRoot(value, x1);
}

function squareRoot(value) {
  return dynamicSquareRoot(bigInt(value), bigInt.one);
}
