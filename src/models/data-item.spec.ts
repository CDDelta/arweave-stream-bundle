import { JWKInterface } from 'arweave/node/lib/wallet';
import { readFile } from 'fs/promises';
import { buffer } from 'stream/consumers';
import { createReadableFileStream } from '../../test/utils';
import { SignatureType } from '../utils';
import { DataItem } from './data-item';
import { DataItemHeader } from './data-item-header';

describe('DataItem', () => {
  it('should be able to be serialized properly', async () => {
    const dataPath = './test/fixtures/tiny-file.md';

    const header = new DataItemHeader();

    const jwk: JWKInterface = await import('../../test/fixtures/test-key.json');
    const dataSigningStream = createReadableFileStream(dataPath);
    await header.sign(SignatureType.PS256_65537, jwk, dataSigningStream);

    const dataItem = new DataItem(header, createReadableFileStream(dataPath));

    const serializationOuput = await buffer(dataItem.createSerializationStream() as any);
    const headerBytes = await buffer(header.createSerializationStream() as any);
    const dataBytes = await readFile(dataPath);

    expect(serializationOuput).toStrictEqual(Buffer.concat([headerBytes, dataBytes]));
  });
});
