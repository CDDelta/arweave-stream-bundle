import { FileHandle, open, readFile } from 'fs/promises';
import { buffer } from 'stream/consumers';
import { ReadableStream, TransformStream } from 'stream/web';
import { DataBundleHeader } from './data-bundle-header';

const DEFAULT_CHUNK_SIZE = 1024;

export function makeReadableByteFileStream(filePath: string): ReadableStream<Uint8Array> {
  let fileHandle: FileHandle;
  let position = 0;
  return new ReadableStream({
    type: 'bytes',
    async start() {
      fileHandle = await open(filePath, 'r');
    },
    async pull(controller) {
      // Even when the consumer is using the default reader, the auto-allocation
      // feature allocates a buffer and passes it to us via byobRequest.
      const byobRequest = controller.byobRequest as any;
      const v = byobRequest.view;

      const { bytesRead } = await fileHandle.read(v, 0, v.byteLength, position);
      if (bytesRead === 0) {
        await fileHandle.close();
        controller.close();
        byobRequest.respond(0);
      } else {
        position += bytesRead;
        byobRequest.respond(bytesRead);
      }
    },
    cancel() {
      return fileHandle.close();
    },
    autoAllocateChunkSize: DEFAULT_CHUNK_SIZE,
  });
}

describe('DataBundleHeader', () => {
  it('should be able to properly deserialize and serialize a bundle header', async () => {
    const bundlePath = './test/fixtures/reference-bundle.bin';
    const bundleStream = makeReadableByteFileStream(bundlePath);

    const { result: header, byteLength: headerByteLength } = await DataBundleHeader.deserialize(bundleStream);
    expect(header.dataItemOffsets).toStrictEqual(new Map([['_34fSWApnGb7TzFbarzCCqawly_OCrcP3q6vA0sKE38', 86434n]]));

    await bundleStream.cancel();

    const headerBytes = await readFile(bundlePath).then((bytes) => bytes.slice(0, headerByteLength));

    const stream = new TransformStream<Uint8Array, Uint8Array>();
    await Promise.all([
      header.serialize(stream.writable).then(() => stream.writable.close()),
      // @ts-ignore
      expect(buffer(stream.readable)).resolves.toStrictEqual(headerBytes),
    ]);
  });
});
