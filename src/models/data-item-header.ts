import Arweave from 'arweave';
import { b64UrlToBuffer, bufferTob64Url, stringToB64Url, stringToBuffer } from 'arweave/node/lib/utils';
import { JWKInterface } from 'arweave/node/lib/wallet';
import { ReadableStream } from 'stream/web';
import {
  decodeTagsFromByteArray,
  deepHashStream,
  encodeTagsToByteArray,
  enqueueOptionalByteArrayToController,
  readByteArrayFromByteReader,
  readOptionalByteArrayFromByteReader,
  readUintLEFromByteReader,
  SignatureType,
  SIGNATURE_TYPE_CONSTANTS,
  Tag,
  uintLEToByteArray,
} from '../utils';
import { DeserializationResult } from './deserialization-result';

export class DataItemHeader {
  id: string | null;
  signatureType = SignatureType.PS256_65537;
  signature: Uint8Array;
  owner: Uint8Array;
  target: Uint8Array | null;
  anchor: Uint8Array | null;

  tags: Tag[] = [];

  constructor(properties: Partial<DataItemHeader> = {}) {
    Object.assign(this, properties);
  }

  static async deserialize(headerStream: ReadableStream<Uint8Array>): Promise<DeserializationResult<DataItemHeader>> {
    const reader = headerStream.getReader({ mode: 'byob' });

    const signatureType: SignatureType = await readUintLEFromByteReader(reader, 2);

    const { signatureByteLength, publicKeyByteLength } = SIGNATURE_TYPE_CONSTANTS[signatureType];
    const signature = await readByteArrayFromByteReader(reader, signatureByteLength);
    const owner = await readByteArrayFromByteReader(reader, publicKeyByteLength);

    const target = await readOptionalByteArrayFromByteReader(reader, 32);
    const anchor = await readOptionalByteArrayFromByteReader(reader, 32);

    const tagCount = await readUintLEFromByteReader(reader, 8);
    const tagByteLength = await readUintLEFromByteReader(reader, 8);

    const tagBytes = await readByteArrayFromByteReader(reader, tagByteLength);
    const tags = decodeTagsFromByteArray(tagBytes);

    reader.releaseLock();

    const id = await Arweave.crypto.hash(signature, 'SHA-256').then((bytes) => bufferTob64Url(bytes));

    return {
      result: new DataItemHeader({
        id,
        signatureType,
        signature,
        owner,
        target,
        anchor,
        tags,
      }),
      byteLength:
        2 + signatureByteLength + publicKeyByteLength + (target ? 33 : 1) + (anchor ? 33 : 1) + 8 + 8 + tagByteLength,
    };
  }

  /** Returns a readable stream for the binary serialization of this item header. */
  createSerializationStream(): ReadableStream<Uint8Array> {
    return new ReadableStream({
      type: 'bytes',
      start: (controller) => {
        controller.enqueue(uintLEToByteArray(this.signatureType, 2));
        controller.enqueue(new Uint8Array(this.signature));
        controller.enqueue(new Uint8Array(this.owner));

        enqueueOptionalByteArrayToController(this.target, controller);
        enqueueOptionalByteArrayToController(this.anchor, controller);

        const tagBytes = encodeTagsToByteArray(this.tags);
        controller.enqueue(uintLEToByteArray(this.tags.length, 8));
        controller.enqueue(uintLEToByteArray(tagBytes.byteLength, 8));
        controller.enqueue(tagBytes);

        controller.close();
      },
    });
  }

  addTag(name: string, value: string): void {
    this.tags.push({
      name: stringToB64Url(name),
      value: stringToB64Url(value),
    });
  }

  async sign(
    signatureType: SignatureType.PS256_65537,
    jwk: JWKInterface,
    dataStream: ReadableStream<Uint8Array>,
  ): Promise<void> {
    this.signatureType = signatureType;
    this.owner ??= b64UrlToBuffer(jwk.n);

    const signatureData = await this.getSignatureData(dataStream);
    this.signature = await Arweave.crypto.sign(jwk, signatureData);
    this.id = await Arweave.crypto.hash(this.signature, 'SHA-256').then((bytes) => bufferTob64Url(bytes));
  }

  async verify(dataStream: ReadableStream<Uint8Array>): Promise<boolean> {
    const expectedId = await Arweave.crypto.hash(this.signature, 'SHA-256').then((bytes) => bufferTob64Url(bytes));
    if (this.id !== expectedId) {
      return false;
    }

    const signatureData = await this.getSignatureData(dataStream);
    switch (this.signatureType) {
      case SignatureType.PS256_65537:
        return await Arweave.crypto.verify(bufferTob64Url(this.owner), signatureData, this.signature);
      default:
        throw Error('Signature type unsupported!');
    }
  }

  async getSignatureData(dataStream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
    return await deepHashStream([
      stringToBuffer('dataitem'),
      stringToBuffer('1'),
      stringToBuffer(this.signatureType.toString()),
      this.owner,
      this.target || new Uint8Array(0),
      this.anchor || new Uint8Array(0),
      encodeTagsToByteArray(this.tags),
      dataStream,
    ]);
  }
}
