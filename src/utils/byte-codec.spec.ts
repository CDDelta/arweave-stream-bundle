import { bigUintLEToByteArray, byteArrayToBigUintLE, byteArrayToUintLE, uintLEToByteArray } from './byte-codec';

describe('LE uint encoding and decoding', () => {
  it('should correctly encode and decode unsigned, low-endian big integers', () => {
    const testCases = new Map<number, Uint8Array>([
      [1, new Uint8Array([1, 0, 0, 0])],
      [15, new Uint8Array([15, 0, 0, 0])],
      [16777216, new Uint8Array([0, 0, 0, 1])],
    ]);

    for (const [uint, byteArray] of testCases.entries()) {
      expect(byteArrayToUintLE(byteArray)).toBe(uint);
      expect(uintLEToByteArray(uint, byteArray.length)).toStrictEqual(byteArray);
    }
  });
});

describe('LE big uint encoding and decoding', () => {
  it('should correctly encode and decode unsigned, low-endian big integers', () => {
    const testCases = new Map<bigint, Uint8Array>([
      [1n, new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0])],
      [15n, new Uint8Array([15, 0, 0, 0, 0, 0, 0, 0])],
      [72057594037927936n, new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1])],
    ]);

    for (const [bigUint, byteArray] of testCases.entries()) {
      expect(byteArrayToBigUintLE(byteArray)).toBe(bigUint);
      expect(bigUintLEToByteArray(bigUint, byteArray.length)).toStrictEqual(byteArray);
    }
  });
});
