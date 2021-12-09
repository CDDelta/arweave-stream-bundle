import { DataItemHeaderProperties } from 'src';
import { ReadableStream } from 'stream/web';

export async function createDataItemAsync(
  properties: DataItemHeaderProperties,
  dataStream: ReadableStream<Uint8Array>,
) {}
