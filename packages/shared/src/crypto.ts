import crypto from 'node:crypto';
import type { ExecutionReceipt, ExecutionReceiptPayload } from './types.js';

export const GENESIS_RECEIPT_HASH = '0'.repeat(64);

export function sha256Hex(input: string | Buffer): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map((item) => canonicalJson(item)).join(',') + ']';
  }
  const record = value as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const pairs = sortedKeys
    .filter((k) => record[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(record[k])}`);
  return '{' + pairs.join(',') + '}';
}

export interface Ed25519KeyPair {
  publicKeyPem: string;
  privateKeyPem: string;
}

export function generateEd25519KeyPair(): Ed25519KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKeyPem: publicKey, privateKeyPem: privateKey };
}

export function signExecutionReceipt(
  payload: ExecutionReceiptPayload,
  privateKeyPem: string,
  publicKeyPem: string
): ExecutionReceipt {
  const canonicalPayload = canonicalJson(payload);
  const receiptHash = sha256Hex(canonicalPayload);
  const signature = crypto
    .sign(null, Buffer.from(receiptHash, 'utf8'), privateKeyPem)
    .toString('base64');

  return {
    ...payload,
    receiptHash,
    signature,
    signerPublicKeyPem: publicKeyPem,
  };
}

export function verifyExecutionReceipt(receipt: ExecutionReceipt): {
  valid: boolean;
  reason?: string;
} {
  try {
    const { receiptHash, signature, signerPublicKeyPem, ...payload } = receipt;
    const expectedHash = sha256Hex(canonicalJson(payload));
    if (expectedHash !== receiptHash) {
      return {
        valid: false,
        reason: `Payload hash mismatch: expected ${expectedHash}, got ${receiptHash}`,
      };
    }
    const sigOk = crypto.verify(
      null,
      Buffer.from(receiptHash, 'utf8'),
      signerPublicKeyPem,
      Buffer.from(signature, 'base64')
    );
    if (!sigOk) {
      return { valid: false, reason: 'Invalid Ed25519 cryptographic signature' };
    }
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      reason: err instanceof Error ? err.message : 'Verification error',
    };
  }
}

export interface ChainVerificationResult {
  valid: boolean;
  totalReceipts: number;
  verifiedCount: number;
  brokenAtStep?: number;
  reason?: string;
  rootHash: string;
  headHash: string;
}

export function verifyReceiptChain(receipts: ExecutionReceipt[]): ChainVerificationResult {
  if (receipts.length === 0) {
    return {
      valid: true,
      totalReceipts: 0,
      verifiedCount: 0,
      rootHash: GENESIS_RECEIPT_HASH,
      headHash: GENESIS_RECEIPT_HASH,
    };
  }

  let expectedPrev = GENESIS_RECEIPT_HASH;
  let verifiedCount = 0;

  for (let i = 0; i < receipts.length; i++) {
    const receipt = receipts[i];
    if (receipt.prevReceiptHash !== expectedPrev) {
      return {
        valid: false,
        totalReceipts: receipts.length,
        verifiedCount,
        brokenAtStep: receipt.stepIndex,
        reason: `Broken hash chain at receipt #${i + 1}: prevReceiptHash=${receipt.prevReceiptHash.slice(0, 12)}... != expected=${expectedPrev.slice(0, 12)}...`,
        rootHash: receipts[0].receiptHash,
        headHash: receipts[receipts.length - 1].receiptHash,
      };
    }

    const singleCheck = verifyExecutionReceipt(receipt);
    if (!singleCheck.valid) {
      return {
        valid: false,
        totalReceipts: receipts.length,
        verifiedCount,
        brokenAtStep: receipt.stepIndex,
        reason: singleCheck.reason,
        rootHash: receipts[0].receiptHash,
        headHash: receipts[receipts.length - 1].receiptHash,
      };
    }

    expectedPrev = receipt.receiptHash;
    verifiedCount++;
  }

  return {
    valid: true,
    totalReceipts: receipts.length,
    verifiedCount,
    rootHash: receipts[0].receiptHash,
    headHash: receipts[receipts.length - 1].receiptHash,
  };
}

export function createRpcHmacHeaders(
  secret: string,
  method: string,
  urlPath: string,
  bodyString: string
): Record<string, string> {
  const timestamp = Date.now().toString();
  const payload = `${timestamp}.${method.toUpperCase()}.${urlPath}.${sha256Hex(bodyString)}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return {
    'x-aegis-timestamp': timestamp,
    'x-aegis-signature': signature,
  };
}

export function verifyRpcHmacHeaders(
  secret: string,
  method: string,
  urlPath: string,
  bodyString: string,
  timestampHeader?: string,
  signatureHeader?: string,
  maxSkewMs = 300_000
): { ok: boolean; reason?: string } {
  if (!timestampHeader || !signatureHeader) {
    return { ok: false, reason: 'Missing HMAC RPC authentication headers' };
  }
  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > maxSkewMs) {
    return { ok: false, reason: 'RPC timestamp expired or skewed' };
  }
  const payload = `${timestampHeader}.${method.toUpperCase()}.${urlPath}.${sha256Hex(bodyString)}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signatureHeader, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'Invalid HMAC-SHA256 RPC signature' };
  }
  return { ok: true };
}
