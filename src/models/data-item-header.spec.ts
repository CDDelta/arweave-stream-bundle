import { JWKInterface } from 'arweave/node/lib/wallet';
import { readFile } from 'fs/promises';
import { buffer } from 'stream/consumers';
import { TransformStream } from 'stream/web';
import { createReadableFileStream } from '../../test/utils';
import { SignatureType } from '../utils';
import { DataItemHeader } from './data-item-header';

describe('DataItemHeader', () => {
  it('should be able to properly deserialize and serialize an item header', async () => {
    const dataItemPath = './test/fixtures/reference-data-item.bin';
    const dataItemStream = createReadableFileStream(dataItemPath);

    const { result: header, byteLength: headerByteLength } = await DataItemHeader.deserialize(dataItemStream);
    await expect(header.verify(dataItemStream)).resolves.toBe(true);

    const headerBytes = await readFile(dataItemPath).then((bytes) => bytes.slice(0, headerByteLength));

    const stream = new TransformStream<Uint8Array, Uint8Array>();
    await Promise.all([
      header.createSerializationStream().pipeTo(stream.writable),
      // @ts-ignore
      expect(buffer(stream.readable)).resolves.toStrictEqual(headerBytes),
    ]);
  });

  it('should be able to properly sign and verify a newly created item header', async () => {
    const header = new DataItemHeader();
    header.addTag('App-Name', 'Test-App');
    header.addTag('Content-Type', 'text/markdown');

    const dataPath = './test/fixtures/tiny-file.md';

    const jwk: JWKInterface = await import('../../test/fixtures/test-key.json');
    const dataSigningStream = createReadableFileStream(dataPath);
    await header.sign(SignatureType.PS256_65537, jwk, dataSigningStream);

    const dataVerificationStream = createReadableFileStream(dataPath);
    await expect(header.verify(dataVerificationStream)).resolves.toBe(true);
  });
});
