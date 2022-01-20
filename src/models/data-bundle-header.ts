import { b64UrlToBuffer, bufferTob64Url } from 'arweave/node/lib/utils';
import { ReadableStream } from 'stream/web';
import {
  bigUintLEToByteArray,
  readBigUintLEFromByteReader,
  readByteArrayFromByteReader,
  uintLEToByteArray,
} from '../utils';
import { DeserializationResult } from './deserialization-result';

export class DataBundleHeader {
  constructor(public dataItemByteLengths: Map<string, bigint>) {}

  static async deserialize(headerStream: ReadableStream<Uint8Array>): Promise<DeserializationResult<DataBundleHeader>> {
    const reader = headerStream.getReader({ mode: 'byob' });

    const dataItemCount = await readBigUintLEFromByteReader(reader, 32);
    const dataItemByteLengths = new Map<string, bigint>();

    for (let i = 0; i < dataItemCount; i++) {
      const itemByteLength = await readBigUintLEFromByteReader(reader, 32);
      const itemId = await readByteArrayFromByteReader(reader, 32);
      dataItemByteLengths.set(bufferTob64Url(itemId), itemByteLength);
    }

    reader.releaseLock();

    return {
      result: new DataBundleHeader(dataItemByteLengths),
      byteLength: 32 + dataItemByteLengths.size * (32 + 32),
    };
  }

  /** Returns a readable stream for the binary serialization of this bundle header. */
  createSerializationStream(): ReadableStream<Uint8Array> {
    return new ReadableStream({
      type: 'bytes',
      start: (controller) => {
        controller.enqueue(uintLEToByteArray(this.dataItemByteLengths.size, 32));

        for (const [itemId, itemOffset] of this.dataItemByteLengths) {
          controller.enqueue(bigUintLEToByteArray(itemOffset, 32));
          controller.enqueue(b64UrlToBuffer(itemId));
        }

        controller.close();
      },
    });
  }

  /** Returns the absolute byte offset of the specified data item from the start of this bundle. */
  getDataItemByteOffset(dataItemId: string): bigint {
    let currentByteOffset = BigInt(32 + (32 + 32) * this.dataItemByteLengths.size);
    for (const [itemId, itemByteLength] of this.dataItemByteLengths.entries()) {
      if (itemId === dataItemId) {
        return currentByteOffset;
      }

      currentByteOffset += itemByteLength;
    }

    throw Error(`${dataItemId} is not present in bundle!`);
  }
}
