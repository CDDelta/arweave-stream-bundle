import deepHash from 'arweave/node/lib/deepHash';
import { stringToBuffer } from 'arweave/node/lib/utils';
import { Readable } from 'stream';
import { deepHashStream } from './deep-hash-stream';

describe('deepHashStream()', () => {
  it('should produce results identical to the reference implementation', async () => {
    const buffer = Buffer.from([256, 128, 64, 32, 16, 8, 4, 2]);
    // @ts-ignore
    const bufferReader = Readable.toWeb(Readable.from(buffer));

    expect(deepHashStream([stringToBuffer('test'), buffer])).resolves.toStrictEqual(
      await deepHash([stringToBuffer('test'), buffer]),
    );

    expect(deepHashStream([stringToBuffer('test'), bufferReader])).resolves.toStrictEqual(
      await deepHash([stringToBuffer('test'), buffer]),
    );
  });
});
