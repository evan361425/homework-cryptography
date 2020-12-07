const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const blockSize = 1024;

describe('Video hash', () => {
  it('check for testing', () => {
    return getBlocksFromVideo('../data/hash-video/6.2.birthday.mp4')
      .then(blocks => {
        const tag = getTagOnFirstBlockWithPrevTag(blocks);
        expect(tag).toBe('03c08f4ee0b576fe319338139c045c89c3e8e9409633bea29442e21425006ea8');
      })
      .catch(err => {
        fail(err);
      });
  });

  it('get result', () => {
    return getBlocksFromVideo('../data/hash-video/6.1.intro.mp4')
      .then(blocks => {
        const tag = getTagOnFirstBlockWithPrevTag(blocks);
        expect(tag).toBeTruthy();
        console.log(`hash tag answer is:\n${tag}`);
      })
      .catch(err => {
        fail(err);
      });
  });
});


function getBlocksFromVideo(filePath) {
  return new Promise((resolve, reject) => {
    filePath = path.join(__dirname, filePath);
    const readStream = fs.createReadStream(filePath, {
      highWaterMark: blockSize,
    });
    const blocks = [];

    readStream.on('data', block => {
      blocks.push(block);
    });

    readStream.on('end', () => {
      resolve(blocks);
    });

    readStream.on('error', reject);
  });
}

/**
 * Result = H(b[0] | H(b[1] | ... | H(b[n-1] || H(b[n]))))
 * @param  {array} blocks blocks in ascending
 * @return {string} tag of first block concat tag of second block
 */
function getTagOnFirstBlockWithPrevTag(blocks) {
  return blocks.reverse().reduce((preTag, block) => {
    const buffer = Buffer.concat([block, Buffer.from(preTag, 'hex')]);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }, '');
}
