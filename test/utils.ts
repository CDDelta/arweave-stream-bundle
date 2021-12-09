import { FileHandle, open } from 'fs/promises';
import { ReadableStream } from 'stream/web';

const DEFAULT_CHUNK_SIZE = 1024;

export function createReadableFileStream(filePath: string, position = 0): ReadableStream<Uint8Array> {
  let fileHandle: FileHandle;
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
