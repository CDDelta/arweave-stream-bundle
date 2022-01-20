import { readFile } from 'fs/promises';
import { buffer } from 'stream/consumers';
import { TransformStream } from 'stream/web';
import { createReadableFileStream } from '../../test/utils';
import { DataBundleHeader } from './data-bundle-header';
import { DataItemHeader } from './data-item-header';

describe('DataBundleHeader', () => {
  it('should be able to properly deserialize and serialize a bundle header', async () => {
    const bundlePath = './test/fixtures/reference-bundle.bin';
    const bundleStream = createReadableFileStream(bundlePath);

    const { result: header, byteLength: headerByteLength } = await DataBundleHeader.deserialize(bundleStream);
    expect([...header.dataItemByteLengths]).toStrictEqual([['_34fSWApnGb7TzFbarzCCqawly_OCrcP3q6vA0sKE38', 86434n]]);

    await bundleStream.cancel();

    const headerBytes = await readFile(bundlePath).then((bytes) => bytes.slice(0, headerByteLength));

    const stream = new TransformStream<Uint8Array, Uint8Array>();
    await Promise.all([
      header.createSerializationStream().pipeTo(stream.writable),
      // @ts-ignore
      expect(buffer(stream.readable)).resolves.toStrictEqual(headerBytes),
    ]);
  });

  it('should compute the accurate data item byte offset', async () => {
    const bundlePath = './test/fixtures/reference-bundle.bin';
    const bundleStream = createReadableFileStream(bundlePath);

    const { result: bundleHeader } = await DataBundleHeader.deserialize(bundleStream);
    await bundleStream.cancel();

    for (const [itemId, _] of bundleHeader.dataItemByteLengths.entries()) {
      const itemByteOffset = bundleHeader.getDataItemByteOffset(itemId);
      const itemStream = createReadableFileStream(bundlePath, Number(itemByteOffset));

      const { result: itemHeader } = await DataItemHeader.deserialize(itemStream);
      await itemStream.cancel();

      expect(itemHeader.id).toBe(itemId);
    }
  });
});
