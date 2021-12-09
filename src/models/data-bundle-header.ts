import { b64UrlToBuffer, bufferTob64Url } from 'arweave/node/lib/utils';
import { ReadableStream, WritableStream } from 'stream/web';
import {
  bigUintLEToByteArray,
  readBigUintLEFromByteReader,
  readByteArrayFromByteReader,
  uintLEToByteArray,
} from '../utils';
import { DeserializationResult } from './deserialization-result';

export class DataBundleHeader {
  protected constructor(public dataItemOffsets: Map<string, bigint>) {}

  static async deserialize(headerStream: ReadableStream<Uint8Array>): Promise<DeserializationResult<DataBundleHeader>> {
    const reader = headerStream.getReader({ mode: 'byob' });

    const dataItemCount = await readBigUintLEFromByteReader(reader, 32);
    const dataItemOffsets = new Map<string, bigint>();

    for (let i = 0; i < dataItemCount; i++) {
      const itemOffset = await readBigUintLEFromByteReader(reader, 32);
      const itemId = await readByteArrayFromByteReader(reader, 32);
      dataItemOffsets.set(bufferTob64Url(itemId), itemOffset);
    }

    reader.releaseLock();

    return {
      result: new DataBundleHeader(dataItemOffsets),
      byteLength: 32 + dataItemOffsets.size * (32 + 32),
    };
  }

  async serialize(headerStream: WritableStream<Uint8Array>): Promise<void> {
    const writer = headerStream.getWriter();

    await writer.write(uintLEToByteArray(this.dataItemOffsets.size, 32));

    for (const [itemId, itemOffset] of this.dataItemOffsets) {
      await writer.write(bigUintLEToByteArray(itemOffset, 32));
      await writer.write(b64UrlToBuffer(itemId));
    }

    writer.releaseLock();
  }
}
