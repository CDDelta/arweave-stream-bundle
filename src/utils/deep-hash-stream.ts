import Arweave from 'arweave';
import { createHash } from 'crypto';
import { pipeline } from 'stream/promises';
import { ReadableStream } from 'stream/web';

type DeepHashChunk = Uint8Array | ReadableStream<Uint8Array>;

export async function deepHashStream(chunks: DeepHashChunk[]): Promise<Uint8Array> {
  const tag = Arweave.utils.concatBuffers([
    Arweave.utils.stringToBuffer('list'),
    Arweave.utils.stringToBuffer(chunks.length.toString()),
  ]);

  return await deepHashChunks(chunks, await Arweave.crypto.hash(tag, 'SHA-384'));
}

async function deepHashChunks(chunks: DeepHashChunk[], acc: Uint8Array): Promise<Uint8Array> {
  if (chunks.length < 1) {
    return acc;
  }

  const hashPair = Arweave.utils.concatBuffers([acc, await deepHashBlob(chunks[0])]);
  const newAcc = await Arweave.crypto.hash(hashPair, 'SHA-384');
  return await deepHashChunks(chunks.slice(1), newAcc);
}

async function deepHashBlob(chunk: DeepHashChunk): Promise<Uint8Array> {
  if (chunk instanceof Uint8Array) {
    const tag = Arweave.utils.concatBuffers([
      Arweave.utils.stringToBuffer('blob'),
      Arweave.utils.stringToBuffer(chunk.byteLength.toString()),
    ]);

    const taggedHash = Arweave.utils.concatBuffers([
      await Arweave.crypto.hash(tag, 'SHA-384'),
      await Arweave.crypto.hash(chunk, 'SHA-384'),
    ]);

    return await Arweave.crypto.hash(taggedHash, 'SHA-384');
  } else {
    const hasher = createHash('sha384');

    let chunkByteLength = 0;
    await pipeline(
      chunk,
      async function* (source: AsyncIterable<Uint8Array>) {
        for await (const buffer of source) {
          chunkByteLength += buffer.byteLength;
          yield buffer;
        }
      },
      hasher,
    );

    const tag = Arweave.utils.concatBuffers([
      Arweave.utils.stringToBuffer('blob'),
      Arweave.utils.stringToBuffer(chunkByteLength.toString()),
    ]);

    const taggedHash = Arweave.utils.concatBuffers([await Arweave.crypto.hash(tag, 'SHA-384'), hasher.digest()]);
    return await Arweave.crypto.hash(taggedHash, 'SHA-384');
  }
}
