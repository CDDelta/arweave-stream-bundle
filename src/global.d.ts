declare module 'stream/web' {
  interface ReadableStream {
    getReader(options: { mode: 'byob' }): ReadableStreamBYOBReader;
  }

  interface ReadableStreamReadResult<T> {
    done: boolean;
    value: T;
  }

  interface ReadableStreamBYOBReader {
    readonly closed: Promise<void>;
    cancel(reason?: any): Promise<void>;
    read<T extends ArrayBufferView>(view: T): Promise<ReadableStreamReadResult<T>>;
    releaseLock(): void;
  }
}
