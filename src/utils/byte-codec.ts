import { ReadableByteStreamController, ReadableStreamBYOBReader } from 'stream/web';

/** Reads a byte array of `byteLength` from the provided reader. */
export async function readByteArrayFromByteReader(
  reader: ReadableStreamBYOBReader,
  byteLength: number,
): Promise<Uint8Array> {
  const { value } = await reader.read(new Uint8Array(byteLength));
  return value;
}

/**
 * Reads an optional byte array of `byteLength` bytes from the provided reader based on the value of the leading presence byte.
 *
 * This will read one (presence) byte and `byteLength` bytes, if the presence byte is one, from the provided reader.
 */
export async function readOptionalByteArrayFromByteReader(
  reader: ReadableStreamBYOBReader,
  byteLength: number,
): Promise<Uint8Array | null> {
  const presenceByte = await readByteArrayFromByteReader(reader, 1).then((byteArray) => byteArray[0]);
  return presenceByte === 1 ? readByteArrayFromByteReader(reader, byteLength) : null;
}

/** Reads an unsigned, little endian integer of `byteLength` from the provided reader. */
export async function readUintLEFromByteReader(reader: ReadableStreamBYOBReader, byteLength: number): Promise<number> {
  const byteArray = await readByteArrayFromByteReader(reader, byteLength);
  return byteArrayToUintLE(byteArray);
}

/** Reads an unsigned, little endian big integer of `byteLength` from the provided reader. */
export async function readBigUintLEFromByteReader(
  reader: ReadableStreamBYOBReader,
  byteLength: number,
): Promise<bigint> {
  const byteArray = await readByteArrayFromByteReader(reader, byteLength);
  return byteArrayToBigUintLE(byteArray);
}

/** Interprets the provided byte array as an unsigned, little endian integer. */
export function byteArrayToUintLE(byteArray: Uint8Array): number {
  let value = 0;
  for (let i = byteArray.byteLength - 1; i >= 0; i--) {
    value = value * 256 + byteArray[i];
  }
  return value;
}

/** Interprets the provided byte array as an unsigned, little endian big integer. */
export function byteArrayToBigUintLE(byteArray: Uint8Array): bigint {
  let value = 0n;
  for (let i = byteArray.byteLength - 1; i >= 0; i--) {
    value = value * 256n + BigInt(byteArray[i]);
  }
  return value;
}

/** Enqueues a presence byte to the provided controller and then the actual provided byte array if it is not `null`. */
export function enqueueOptionalByteArrayToController(
  byteArray: Uint8Array | null,
  controller: ReadableByteStreamController,
) {
  controller.enqueue(byteArray ? new Uint8Array([1]) : new Uint8Array([0]));
  if (byteArray) {
    controller.enqueue(byteArray);
  }
}

/** Converts the provided unsigned int into a byte array of little endian format. */
export function uintLEToByteArray(uint: number, byteLength: number): Uint8Array {
  const byteArray = new Uint8Array(byteLength);
  for (let index = 0; index < byteArray.length; index++) {
    const byte = uint & 0xff;
    byteArray[index] = byte;
    uint = (uint - byte) / 256;
  }
  return byteArray;
}

/** Converts the provided unsigned big int into a byte array of little endian format. */
export function bigUintLEToByteArray(bigUint: bigint, byteLength: number): Uint8Array {
  const byteArray = new Uint8Array(byteLength);
  for (let index = 0; index < byteArray.length; index++) {
    const byte = bigUint & 0xffn;
    byteArray[index] = Number(byte);
    bigUint = (bigUint - byte) / 256n;
  }
  return byteArray;
}
