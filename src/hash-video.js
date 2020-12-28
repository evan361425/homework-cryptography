const fs = require('fs');
const crypto = require('crypto');
const { joinPath, readFile, writeFile } = require('./helper');

/** @var {string} used folder */
const FOLDER = 'hash-video';
/** @var {string} get videos name and expect tag */
const DATA_PATH = `${FOLDER}/data.json`;
/** @var {string} file to output */
const OUTPUT_PATH = `${FOLDER}/result.json`;
/** @var {number} block size */
const BLOCK_SIZE = 1024;

describe('Video Hash Block By Block', () => {
  let shouldPending = false;

  it('should found videos file', () => {
    const videos = readFile(DATA_PATH);

    expect(videos).toBeTruthy();
    shouldPending = false;
  });

  it('should found test video', () => {
    const videos = readFile(DATA_PATH);

    expect(videos.test).toBeTruthy();

    const videoPath = joinPath(`${FOLDER}/${videos.test.video}`);
    if (!fs.existsSync(videoPath)) {
      return pending(`Can't find video ${videoPath}`);
    }
    shouldPending = false;
  });

  it('run on check video', () => {
    shouldPending = false;
    const videos = readFile(DATA_PATH);
    if (!videos.check || !videos.check.video || !videos.check.tag) {
      return;
    }

    const videoPath = joinPath(`${FOLDER}/${videos.check.video}`);
    if (!fs.existsSync(videoPath)) {
      return;
    }

    return getBlocksFromVideo(videoPath)
      .then((blocks) => {
        const tag = getTagOnFirstBlockWithPrevTag(blocks);

        expect(tag).toBe(videos.check.tag);
      })
      .catch((err) => {
        fail(err);
      });
  });

  it('run on test video', () => {
    const videos = readFile(DATA_PATH);
    const videoPath = joinPath(`${FOLDER}/${videos.test.video}`);

    return getBlocksFromVideo(videoPath)
      .then((blocks) => {
        const tag = getTagOnFirstBlockWithPrevTag(blocks);
        writeFile(OUTPUT_PATH, tag);

        expect(tag).toBeTruthy();
      })
      .catch((err) => {
        fail(err);
      });
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
      console.log(`\nFound first block's tag:\n${result}`);
    }
  });
});


function getBlocksFromVideo(filePath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath, {
      highWaterMark: BLOCK_SIZE,
    });
    const blocks = [];

    readStream.on('data', (block) => {
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
