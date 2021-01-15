const workerpool = require('workerpool');
const bigInt = require('big-integer');

function buildTable(x, generator, hold, prime) {
  // 1 / (g ^ x1)
  const gxInv = bigInt(generator).modPow(x, prime).modInv(prime);
  // h / (g ^ x1)
  return bigInt(hold).multiply(gxInv).mod(prime).toString();
}

function hitTable(x, base, prime) {
  return bigInt(base).modPow(x, prime).toString();
}

// create a worker and register public functions
workerpool.worker({
  buildTable: buildTable,
  hitTable: hitTable,
});
