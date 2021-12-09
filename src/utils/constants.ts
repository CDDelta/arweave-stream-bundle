export enum SignatureType {
  PS256_65537 = 1,
  Ed25519 = 2,
  ES256K = 3,
  ES256K_Compact = 4,
}

export const SIGNATURE_TYPE_CONSTANTS: Record<
  SignatureType,
  { signatureByteLength: number; publicKeyByteLength: number }
> = {
  [SignatureType.PS256_65537]: {
    signatureByteLength: 512,
    publicKeyByteLength: 512,
  },
  [SignatureType.Ed25519]: {
    signatureByteLength: 64,
    publicKeyByteLength: 32,
  },
  [SignatureType.ES256K]: {
    signatureByteLength: 65,
    publicKeyByteLength: 65,
  },
  [SignatureType.ES256K_Compact]: {
    signatureByteLength: 65,
    publicKeyByteLength: 33,
  },
};
