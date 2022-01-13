import deepHash from 'arweave/node/lib/deepHash';
import { stringToBuffer } from 'arweave/node/lib/utils';
import { readFile } from 'fs/promises';
import { createReadableFileStream } from '../../test/utils';
import { deepHashStream } from './deep-hash-stream';

describe('deepHashStream()', () => {
  it('should produce results identical to the reference implementation', async () => {
    const filePath = './test/fixtures/tiny-file.md';
    const fileBuffer = await readFile(filePath);
    const fileStream = createReadableFileStream(filePath);

    const expectedResult = await deepHash([stringToBuffer('test'), fileBuffer]);

    await expect(deepHashStream([stringToBuffer('test'), fileBuffer])).resolves.toStrictEqual(expectedResult);
    await expect(deepHashStream([stringToBuffer('test'), fileStream])).resolves.toStrictEqual(expectedResult);
  });
});
