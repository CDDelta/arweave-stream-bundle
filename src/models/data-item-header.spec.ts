import { JWKInterface } from 'arweave/node/lib/wallet';
import { existsSync } from 'fs';
import { open, readFile } from 'fs/promises';
import { buffer } from 'stream/consumers';
import { TransformStream } from 'stream/web';
import { promisify } from 'util';
import { createReadableFileStream, createUint8ArrayTransformer } from '../../test/utils';
import { DataItemHeader } from './data-item-header';
import { SignatureType } from './signature-type';

const exec = promisify(require('child_process').exec);

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
    jest.setTimeout(60 * 1000);

    const header = new DataItemHeader();
    header.addTag('App-Name', 'Test-App');
    header.addTag('Content-Type', 'text/markdown');

    const dataPath = './test/fixtures/large-file.bin';
    if (!existsSync(dataPath)) {
      await exec(`fallocate -l 5G ${dataPath}`);
    }

    const jwk: JWKInterface = await import('../../test/fixtures/test-key.json');

    const signingDataFile = await open(dataPath, 'r');
    const signingDataStream = signingDataFile.readableWebStream().pipeThrough(createUint8ArrayTransformer());
    await header.sign(SignatureType.PS256_65537, jwk, signingDataStream);
    await signingDataFile.close();

    const verificationDataFile = await open(dataPath, 'r');
    const verificationDataStream = verificationDataFile.readableWebStream().pipeThrough(createUint8ArrayTransformer());
    await expect(header.verify(verificationDataStream)).resolves.toBe(true);
    await verificationDataFile.close();
  });
});
