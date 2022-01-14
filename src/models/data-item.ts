import { ReadableByteStreamControllerCallback, ReadableStream } from 'stream/web';
import { DataItemHeader } from './data-item-header';

/** A container class for the convenient passing and serialization of data items. */
export class DataItem {
  /**
   * @param header the header associated with this data item.
   * @param dataStreamer a function that returns a `ReadableStream` of this data item's data.
   */
  constructor(readonly header: DataItemHeader, readonly dataStreamer: () => ReadableStream<Uint8Array>) {}

  /** Returns a readable stream for the binary serialization of this data item. */
  createSerializationStream(): ReadableStream<Uint8Array> {
    const sourceStreams = [this.header.createSerializationStream(), this.dataStreamer()];

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
