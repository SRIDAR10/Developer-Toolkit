import { jwtVerify, SignJWT, importSPKI, importPKCS8 } from 'jose';

export interface JwtDecodeResult {
  valid: boolean;
  header?: any;
  payload?: any;
  error?: string;
}

/**
 * Decodes a JWT token without verification
 * @param token - The JWT token to decode
 * @returns Decoded JWT result
 */
export const decodeJwt = (token: string): JwtDecodeResult => {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token is required and must be a string' };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid JWT format. Expected 3 parts separated by dots.' };
    }

    const [headerPart, payloadPart] = parts;

    // Decode header
    let header: any;
    try {
      const headerDecoded = atob(headerPart.replace(/-/g, '+').replace(/_/g, '/'));
      header = JSON.parse(headerDecoded);
    } catch (error) {
      return { valid: false, error: 'Invalid JWT header encoding' };
    }

    // Decode payload
    let payload: any;
    try {
      const payloadDecoded = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
      payload = JSON.parse(payloadDecoded);
    } catch (error) {
      return { valid: false, error: 'Invalid JWT payload encoding' };
    }

    return {
      valid: true,
      header,
      payload
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to decode JWT'
    };
  }
};

/**
 * Verifies JWT signature
 * @param token - The JWT token to verify
 * @param key - The secret key (HS256) or public key (RS256)
 * @param algorithm - The algorithm to use for verification
 * @returns Promise<boolean> - Whether the signature is valid
 */
export const verifyJwtSignature = async (
  token: string,
  key: string,
  algorithm: 'HS256' | 'RS256'
): Promise<boolean> => {
  try {
    if (!token || !key) {
      throw new Error('Token and key are required');
    }

    let cryptoKey: any;

    if (algorithm === 'HS256') {
      // For HMAC, use the secret directly as bytes
      cryptoKey = new TextEncoder().encode(key);
    } else if (algorithm === 'RS256') {
      // For RSA, import the public key
      if (!key.includes('BEGIN PUBLIC KEY') && !key.includes('BEGIN RSA PUBLIC KEY')) {
        throw new Error('Invalid public key format. Expected PEM format.');
      }
      cryptoKey = await importSPKI(key, 'RS256');
    } else {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    // Verify the token
    await jwtVerify(token, cryptoKey, {
      algorithms: [algorithm]
    });

    return true;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return false;
  }
};

/**
 * Creates a JWT token (for testing purposes)
 * @param payload - The payload to encode
 * @param secret - The secret key for signing
 * @param algorithm - The algorithm to use
 * @returns Promise<string> - The signed JWT token
 */
export const createJwt = async (
  payload: any,
  secret: string,
  algorithm: 'HS256' | 'RS256' = 'HS256'
): Promise<string> => {
  try {
    let key: any;

    if (algorithm === 'HS256') {
      key = new TextEncoder().encode(secret);
    } else {
      // For RS256, expect a private key
      key = await importPKCS8(secret, 'RS256');
    }

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: algorithm })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(key);

    return jwt;
  } catch (error) {
    throw new Error(`Failed to create JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Validates JWT payload structure
 * @param payload - The payload to validate
 * @returns Validation result with any issues found
 */
export const validateJwtPayload = (payload: any): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return { valid: false, issues: ['Payload must be an object'] };
  }

  // Check for expired token
  if (payload.exp && typeof payload.exp === 'number') {
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      issues.push('Token has expired');
    }
  }

  // Check for not-before time
  if (payload.nbf && typeof payload.nbf === 'number') {
    const now = Math.floor(Date.now() / 1000);
    if (payload.nbf > now) {
      issues.push('Token is not yet valid (nbf claim)');
    }
  }

  // Check for issued-at time in the future
  if (payload.iat && typeof payload.iat === 'number') {
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutesFromNow = now + 300; // 5 minutes tolerance
    if (payload.iat > fiveMinutesFromNow) {
      issues.push('Token issued in the future (iat claim)');
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
};