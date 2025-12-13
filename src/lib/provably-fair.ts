/**
 * Provably Fair Game Engine
 * Implements cryptographic fairness verification using HMAC-SHA256
 * Compliant with industry standards for provably fair gaming
 * Uses Web Crypto API for browser compatibility
 */

export interface GameOutcome {
  outcome: number; // 0-99.99
  hex: string; // First 8 hex characters used
  hmac: string; // Full HMAC hash
}

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert string to Uint8Array
 */
function stringToBuffer(str: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(str);
  // Ensure it's ArrayBuffer not ArrayBufferLike
  return new Uint8Array(encoded.buffer.slice(0));
}

/**
 * Generate SHA-256 hash of a string using Web Crypto API
 */
export async function sha256(input: string): Promise<string> {
  const buffer = stringToBuffer(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return bufferToHex(hashBuffer);
}

/**
 * Generate HMAC-SHA256 using Web Crypto API
 */
async function hmacSha256(key: string, message: string): Promise<string> {
  const keyBuffer = stringToBuffer(key);
  const messageBuffer = stringToBuffer(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
  return bufferToHex(signature);
}

/**
 * Calculate provably fair game outcome using HMAC-SHA256
 * @param serverSeed - Server seed (actual value, not hash)
 * @param clientSeed - Client seed chosen by player
 * @param nonce - Sequential number for each game round
 * @returns outcome value between 0-99.99
 */
export async function calculateOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<GameOutcome> {
  // Create HMAC with server seed as key
  const hmac = await hmacSha256(serverSeed, `${clientSeed}:${nonce}`);

  // Take first 8 hex characters (4 bytes)
  const hex = hmac.substring(0, 8);

  // Convert to decimal
  const decimal = parseInt(hex, 16);

  // Calculate outcome: modulo 10000 to get 0-9999, then divide by 100 for 0-99.99
  const outcome = (decimal % 10000) / 100;

  return {
    outcome,
    hex,
    hmac,
  };
}

/**
 * Verify a game outcome matches the expected result
 * Used for fairness verification after game completion
 */
export async function verifyOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  expectedOutcome: number
): Promise<boolean> {
  const result = await calculateOutcome(serverSeed, clientSeed, nonce);
  // Use toFixed to handle floating point precision
  return result.outcome.toFixed(2) === expectedOutcome.toFixed(2);
}

/**
 * Generate a cryptographically secure random seed using Web Crypto API
 * Used for server seed generation
 * Works in all modern browsers
 */
export function generateSecureRandomSeed(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
}

/**
 * Calculate game result multiplier based on outcome and target
 * For dice game: win if outcome < target, multiplier = 99 / target
 */
export function calculateMultiplier(target: number): number {
  if (target <= 0 || target >= 100) {
    throw new Error('Target must be between 0 and 100');
  }
  // Multiplier with 1% house edge
  return (99 / target);
}

/**
 * Check if player won based on outcome and target
 */
export function checkWin(outcome: number, target: number): boolean {
  return outcome < target;
}

/**
 * Calculate win amount based on bet amount, outcome, and target
 */
export function calculateWinAmount(
  betAmount: string,
  outcome: number,
  target: number
): string {
  const bet = parseFloat(betAmount);
  if (checkWin(outcome, target)) {
    const multiplier = calculateMultiplier(target);
    return (bet * multiplier).toFixed(8);
  }
  return '0';
}
