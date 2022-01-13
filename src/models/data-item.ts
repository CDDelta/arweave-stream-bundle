import { ReadableByteStreamControllerCallback, ReadableStream } from 'stream/web';
import { DataItemHeader } from './data-item-header';

export class DataItem {
  constructor(readonly header: DataItemHeader, readonly data: ReadableStream<Uint8Array>) {}

  /** Returns a readable stream for the binary serialization of this item header. */
  createSerializationStream(): ReadableStream<Uint8Array> {
    const sourceStreams = [this.header.createSerializationStream(), this.data];

    let sourceStreamIndex = 0;
    let streamIterator: AsyncIterableIterator<Uint8Array> | null;

    const pull: ReadableByteStreamControllerCallback = async (controller) => {
      if (!streamIterator) {
        streamIterator = sourceStreams[sourceStreamIndex][Symbol.asyncIterator]();
      }

      const { done, value } = await streamIterator.next();
      if (value) {
        controller.enqueue(value);
      }

      if (done) {
        streamIterator = null;
        sourceStreamIndex++;

        if (sourceStreamIndex >= sourceStreams.length) {
          controller.close();
        } else {
          // Pull again as we need to enqueue a value to the controller before fulfilling this promise.
          await pull(controller);
        }
      }
    };

    return new ReadableStream({
      type: 'bytes',
      pull,
    });
  }
}
