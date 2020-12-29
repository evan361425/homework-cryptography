const bigInt = require('big-integer');
const crypto = require('crypto');
const { HexStr } = require('./helper');

/* eslint-disable */
describe('Playground', () => {
  it('give me ASE-CBC decrypted message from cypher(prefix IV) and key', () => {
    const cypher = '4ca00ff4c898d61e1edbf1800618fb2828a226d160dad07883d04e008a7897ee2e4b7465d5290d0c0e6c6822236e1daafb94ffe0c5da05d9476be028ad7c1d81';
    const key = Buffer.from('140b41b22a29beb4061bda66b6747e14', 'hex');

    const iv = Buffer.from(cypher.substr(0, 32), 'hex');
    const decrypted = cypher.substr(32);

    const decipher = crypto.createDecipheriv('aes128', key, iv);
    const message = decipher.update(decrypted, 'hex', 'utf8').concat(decipher.final('utf8'));
    expect(message).toBe('Basic CBC mode encryption needs padding.');
  });

  it('give me ASE-CTR decrypted message from cypher(prefix IV) and key', () => {
    const cypher = '69dda8455c7dd4254bf353b773304eec0ec7702330098ce7f7520d1cbbb20fc388d1b0adb5054dbd7370849dbf0b88d393f252e764f1f5f7ad97ef79d59ce29f5f51eeca32eabedd9afa9329';
    const key = Buffer.from('36f18357be4dbd77f050515c73fcf9f2', 'hex');

    const iv = Buffer.from(cypher.substr(0, 32), 'hex');
    const decrypted = cypher.substr(32);

    const decipher = crypto.createDecipheriv('aes-128-ctr', key, iv);
    const message = decipher.update(decrypted, 'hex', 'utf8').concat(decipher.final('utf8'));
    expect(message).toBe('CTR mode lets you build a stream cipher from a block cipher.');
  });

  it('give me RSA decrypted message from cypher, N, p and e value!', () => {
    const cypher = bigInt('22096451867410381776306561134883418017410069787892831071731839143676135600120538004282329650473509424343946219751512256465839967942889460764542040581564748988013734864120452325229320176487916666402997509188729971690526083222067771600019329260870009579993724077458967773697817571267229951148662959627934791540');
    const N = bigInt('179769313486231590772930519078902473361797697894230657273430081157732675805505620686985379449212982959585501387537164015710139858647833778606925583497541085196591615128057575940752635007475935288710823649949940771895617054361149474865046711015101563940680527540071584560878577663743040086340742855278549092581');
    const p = bigInt('13407807929942597099574024998205846127479365820592393377723561443721764030073662768891111614362326998675040546094339320838419523375986027530441562135724301');
    const e = bigInt('65537');

    const q = N.divide(p);
    const phiN = p.minus(1).times(q.minus(1));
    const d = e.modInv(phiN);
    expect(d.times(e).mod(phiN).toString()).toBe('1');

    const hexMessage = cypher.modPow(d, N).toString(16);
    expect(hexMessage.substr(0, 2)).toBe('20');
    const padding = hexMessage.indexOf('00') + 2;
    const message = (new HexStr(hexMessage.substr(padding))).toChar().join('');

    expect(message).toBe('Factoring lets us break RSA.');
  });
});
/* eslint-enable */
