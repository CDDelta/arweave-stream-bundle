import { ReadableStream } from 'stream/web';
import { DataItemHeader } from './data-item-header';

export class DataItem {
  constructor(readonly header: DataItemHeader, readonly data: ReadableStream<Uint8Array>) {}
}
