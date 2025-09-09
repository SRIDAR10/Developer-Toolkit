import { describe, it, expect, vi } from 'vitest';
import { decodeJwt, verifyJwtSignature, validateJwtPayload, createJwt } from '../jwtUtils';

// Mock jose library
vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue('mocked.jwt.token')
  })),
  importSPKI: vi.fn(),
  importPKCS8: vi.fn()
}));

describe('jwtUtils', () => {
  describe('decodeJwt', () => {
    it('should decode a valid JWT token', () => {
      // Create a valid JWT token manually for testing
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = { sub: '1234567890', name: 'John Doe', iat: 1516239022 };
      
      const encodedHeader = btoa(JSON.stringify(header));
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `${encodedHeader}.${encodedPayload}.signature`;
      
      const result = decodeJwt(token);
      
      expect(result.valid).toBe(true);
      expect(result.header).toEqual(header);
      expect(result.payload).toEqual(payload);
      expect(result.error).toBeUndefined();
    });

    it('should handle invalid JWT format', () => {
      const result = decodeJwt('invalid.token');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid JWT format. Expected 3 parts separated by dots.');
    });

    it('should handle empty token', () => {
      const result = decodeJwt('');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token is required and must be a string');
    });

    it('should handle invalid header encoding', () => {
      const result = decodeJwt('invalid-header.valid-payload.signature');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid JWT header encoding');
    });

    it('should handle invalid payload encoding', () => {
      const header = { alg: 'HS256', typ: 'JWT' };
      const encodedHeader = btoa(JSON.stringify(header));
      const result = decodeJwt(`${encodedHeader}.invalid-payload.signature`);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid JWT payload encoding');
    });

    it('should handle non-string input', () => {
      const result = decodeJwt(null as any);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token is required and must be a string');
    });
  });

  describe('verifyJwtSignature', () => {
    it('should verify HS256 signature successfully', async () => {
      const { jwtVerify } = await import('jose');
      (jwtVerify as any).mockResolvedValue({ payload: {}, protectedHeader: {} });
      
      const result = await verifyJwtSignature('valid.jwt.token', 'secret', 'HS256');
      
      expect(result).toBe(true);
      expect(jwtVerify).toHaveBeenCalled();
    });

    it('should verify RS256 signature successfully', async () => {
      const { jwtVerify, importSPKI } = await import('jose');
      (jwtVerify as any).mockResolvedValue({ payload: {}, protectedHeader: {} });
      (importSPKI as any).mockResolvedValue('mocked-key');
      
      const publicKey = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----';
      const result = await verifyJwtSignature('valid.jwt.token', publicKey, 'RS256');
      
      expect(result).toBe(true);
      expect(importSPKI).toHaveBeenCalledWith(publicKey, 'RS256');
    });

    it('should handle verification failure', async () => {
      const { jwtVerify } = await import('jose');
      (jwtVerify as any).mockRejectedValue(new Error('Invalid signature'));
      
      const result = await verifyJwtSignature('invalid.jwt.token', 'secret', 'HS256');
      
      expect(result).toBe(false);
    });

    it('should handle missing token or key', async () => {
      const result = await verifyJwtSignature('', 'secret', 'HS256');
      expect(result).toBe(false);
      
      const result2 = await verifyJwtSignature('token', '', 'HS256');
      expect(result2).toBe(false);
    });

    it('should handle invalid public key format', async () => {
      const result = await verifyJwtSignature('token', 'invalid-key', 'RS256');
      expect(result).toBe(false);
    });
  });

  describe('validateJwtPayload', () => {
    it('should validate a valid payload', () => {
      const payload = {
        sub: '1234567890',
        name: 'John Doe',
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) + 3600  // 1 hour from now
      };
      
      const result = validateJwtPayload(payload);
      
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect expired token', () => {
      const payload = {
        sub: '1234567890',
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
      
      const result = validateJwtPayload(payload);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Token has expired');
    });

    it('should detect not-yet-valid token', () => {
      const payload = {
        sub: '1234567890',
        nbf: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
      
      const result = validateJwtPayload(payload);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Token is not yet valid (nbf claim)');
    });

    it('should detect token issued in the future', () => {
      const payload = {
        sub: '1234567890',
        iat: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
      
      const result = validateJwtPayload(payload);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Token issued in the future (iat claim)');
    });

    it('should handle invalid payload', () => {
      const result = validateJwtPayload(null);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Payload must be an object');
    });

    it('should handle multiple issues', () => {
      const payload = {
        exp: Math.floor(Date.now() / 1000) - 3600, // expired
        nbf: Math.floor(Date.now() / 1000) + 1800, // not yet valid
        iat: Math.floor(Date.now() / 1000) + 3600  // issued in future
      };
      
      const result = validateJwtPayload(payload);
      
      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(3);
    });
  });

  describe('createJwt', () => {
    it('should create a JWT token with HS256', async () => {
      const payload = { sub: '1234567890', name: 'John Doe' };
      const secret = 'test-secret';
      
      const result = await createJwt(payload, secret, 'HS256');
      
      expect(result).toBe('mocked.jwt.token');
    });

    it('should create a JWT token with RS256', async () => {
      const { importPKCS8 } = await import('jose');
      (importPKCS8 as any).mockResolvedValue('mocked-private-key');
      
      const payload = { sub: '1234567890', name: 'John Doe' };
      const privateKey = '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----';
      
      const result = await createJwt(payload, privateKey, 'RS256');
      
      expect(result).toBe('mocked.jwt.token');
      expect(importPKCS8).toHaveBeenCalledWith(privateKey, 'RS256');
    });

    it('should handle creation errors', async () => {
      const { SignJWT } = await import('jose');
      const mockSignJWT = {
        setProtectedHeader: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        sign: vi.fn().mockRejectedValue(new Error('Signing failed'))
      };
      (SignJWT as any).mockImplementation(() => mockSignJWT);
      
      const payload = { sub: '1234567890' };
      const secret = 'test-secret';
      
      await expect(createJwt(payload, secret, 'HS256')).rejects.toThrow('Failed to create JWT: Signing failed');
    });
  });
});