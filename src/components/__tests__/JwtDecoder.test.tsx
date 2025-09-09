import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JwtDecoder } from '../JwtDecoder';

// Mock the utils
vi.mock('../../utils/jwtUtils', () => ({
  decodeJwt: vi.fn(),
  verifyJwtSignature: vi.fn()
}));

vi.mock('../../utils/jsonUtils', () => ({
  copyToClipboard: vi.fn(),
  downloadFile: vi.fn()
}));

import { decodeJwt, verifyJwtSignature } from '../../utils/jwtUtils';
import { copyToClipboard, downloadFile } from '../../utils/jsonUtils';

describe('JwtDecoder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all UI elements', () => {
    render(<JwtDecoder />);
    
    expect(screen.getByText('JWT Decoder')).toBeInTheDocument();
    expect(screen.getByText('JWT Token')).toBeInTheDocument();
    expect(screen.getByText('Signature Verification')).toBeInTheDocument();
    expect(screen.getByText('Algorithm')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste your JWT token here...')).toBeInTheDocument();
    expect(screen.getByText('Upload File')).toBeInTheDocument();
  });

  it('should handle JWT input change', async () => {
    const user = userEvent.setup();
    (decodeJwt as any).mockReturnValue({
      valid: true,
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: '1234567890', name: 'John Doe' }
    });
    
    render(<JwtDecoder />);
    
    const textarea = screen.getByPlaceholderText('Paste your JWT token here...');
    await user.type(textarea, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature');
    
    expect(decodeJwt).toHaveBeenCalledWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature');
  });

  it('should display decoded JWT header and payload', async () => {
    const user = userEvent.setup();
    const mockDecoded = {
      valid: true,
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: '1234567890', name: 'John Doe', exp: 1234567890 }
    };
    (decodeJwt as any).mockReturnValue(mockDecoded);
    
    render(<JwtDecoder />);
    
    const textarea = screen.getByPlaceholderText('Paste your JWT token here...');
    await user.type(textarea, 'valid.jwt.token');
    
    await waitFor(() => {
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Payload')).toBeInTheDocument();
      expect(screen.getByText('Token Information')).toBeInTheDocument();
    });
  });

  it('should display error for invalid JWT', async () => {
    const user = userEvent.setup();
    (decodeJwt as any).mockReturnValue({
      valid: false,
      error: 'Invalid JWT format'
    });
    
    render(<JwtDecoder />);
    
    const textarea = screen.getByPlaceholderText('Paste your JWT token here...');
    await user.type(textarea, 'invalid.jwt');
    
    await waitFor(() => {
      expect(screen.getByText('Invalid JWT Token')).toBeInTheDocument();
      expect(screen.getByText('Invalid JWT format')).toBeInTheDocument();
    });
  });

  it('should handle algorithm selection change', async () => {
    const user = userEvent.setup();
    render(<JwtDecoder />);
    
    const algorithmSelect = screen.getByDisplayValue('HS256 (HMAC)');
    await user.selectOptions(algorithmSelect, 'RS256');
    
    expect(algorithmSelect).toHaveValue('RS256');
    expect(screen.getByText('Public Key (PEM format)')).toBeInTheDocument();
  });

  it('should handle secret key input for HS256', async () => {
    const user = userEvent.setup();
    render(<JwtDecoder />);
    
    const secretInput = screen.getByPlaceholderText('Enter secret key for HMAC verification...');
    await user.type(secretInput, 'my-secret-key');
    
    expect(secretInput).toHaveValue('my-secret-key');
  });

  it('should handle public key input for RS256', async () => {
    const user = userEvent.setup();
    render(<JwtDecoder />);
    
    const algorithmSelect = screen.getByDisplayValue('HS256 (HMAC)');
    await user.selectOptions(algorithmSelect, 'RS256');
    
    const publicKeyTextarea = screen.getByPlaceholderText(/-----BEGIN PUBLIC KEY-----/);
    await user.type(publicKeyTextarea, '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----');
    
    expect(publicKeyTextarea).toHaveValue('-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----');
  });

  it('should verify JWT signature successfully', async () => {
    const user = userEvent.setup();
    const mockDecoded = {
      valid: true,
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: '1234567890', name: 'John Doe' }
    };
    (decodeJwt as any).mockReturnValue(mockDecoded);
    (verifyJwtSignature as any).mockResolvedValue(true);
    
    render(<JwtDecoder />);
    
    const textarea = screen.getByPlaceholderText('Paste your JWT token here...');
    await user.type(textarea, 'valid.jwt.token');
    
    const secretInput = screen.getByPlaceholderText('Enter secret key for HMAC verification...');
    await user.type(secretInput, 'secret');
    
    await waitFor(() => {
      expect(screen.getByText('Signature verified successfully')).toBeInTheDocument();
    });
  });

  it('should show signature verification failure', async () => {
    const user = userEvent.setup();
    const mockDecoded = {
      valid: true,
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: '1234567890', name: 'John Doe' }
    };
    (decodeJwt as any).mockReturnValue(mockDecoded);
    (verifyJwtSignature as any).mockResolvedValue(false);
    
    render(<JwtDecoder />);
    
    const textarea = screen.getByPlaceholderText('Paste your JWT token here...');
    await user.type(textarea, 'valid.jwt.token');
    
    const secretInput = screen.getByPlaceholderText('Enter secret key for HMAC verification...');
    await user.type(secretInput, 'wrong-secret');
    
    await waitFor(() => {
      expect(screen.getByText('Invalid signature')).toBeInTheDocument();
    });
  });

  it('should handle copy header functionality', async () => {
    const user = userEvent.setup();
    const mockDecoded = {
      valid: true,
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: '1234567890', name: 'John Doe' }
    };
    (decodeJwt as any).mockReturnValue(mockDecoded);
    (copyToClipboard as any).mockResolvedValue(true);
    
    render(<JwtDecoder />);
    
    const textarea = screen.getByPlaceholderText('Paste your JWT token here...');
    await user.type(textarea, 'valid.jwt.token');
    
    await waitFor(() => {
      const copyButtons = screen.getAllByText('Copy');
      expect(copyButtons.length).toBeGreaterThan(0);
    });
    
    const copyButtons = screen.getAllByText('Copy');
    await user.click(copyButtons[0]); // Click first copy button (header)
    
    expect(copyToClipboard).toHaveBeenCalledWith(JSON.stringify(mockDecoded.header, null, 2));
  });

  it('should handle download functionality', async () => {
    const user = userEvent.setup();
    const mockDecoded = {
      valid: true,
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: '1234567890', name: 'John Doe' }
    };
    (decodeJwt as any).mockReturnValue(mockDecoded);
    
    render(<JwtDecoder />);
    
    const textarea = screen.getByPlaceholderText('Paste your JWT token here...');
    await user.type(textarea, 'valid.jwt.token');
    
    await waitFor(() => {
      const downloadButtons = screen.getAllByText('Download');
      expect(downloadButtons.length).toBeGreaterThan(0);
    });
    
    const downloadButtons = screen.getAllByText('Download');
    await user.click(downloadButtons[0]); // Click first download button (header)
    
    expect(downloadFile).toHaveBeenCalledWith(
      JSON.stringify(mockDecoded.header, null, 2),
      'jwt-header.json',
      'application/json'
    );
  });

  it('should display token information', async () => {
    const user = userEvent.setup();
    const mockDecoded = {
      valid: true,
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { 
        sub: '1234567890', 
        name: 'John Doe',
        iss: 'test-issuer',
        exp: 1234567890
      }
    };
    (decodeJwt as any).mockReturnValue(mockDecoded);
    
    render(<JwtDecoder />);
    
    const textarea = screen.getByPlaceholderText('Paste your JWT token here...');
    await user.type(textarea, 'valid.jwt.token');
    
    await waitFor(() => {
      expect(screen.getByText('Algorithm:')).toBeInTheDocument();
      expect(screen.getByText('HS256')).toBeInTheDocument();
      expect(screen.getByText('Type:')).toBeInTheDocument();
      expect(screen.getByText('JWT')).toBeInTheDocument();
      expect(screen.getByText('Issuer:')).toBeInTheDocument();
      expect(screen.getByText('test-issuer')).toBeInTheDocument();
      expect(screen.getByText('Expires:')).toBeInTheDocument();
    });
  });

  it('should handle file upload', async () => {
    render(<JwtDecoder />);
    
    const fileUploadButton = screen.getByText('Upload File');
    expect(fileUploadButton).toBeInTheDocument();
  });

  it('should show copy success message', async () => {
    const user = userEvent.setup();
    const mockDecoded = {
      valid: true,
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: '1234567890', name: 'John Doe' }
    };
    (decodeJwt as any).mockReturnValue(mockDecoded);
    (copyToClipboard as any).mockResolvedValue(true);
    
    render(<JwtDecoder />);
    
    const textarea = screen.getByPlaceholderText('Paste your JWT token here...');
    await user.type(textarea, 'valid.jwt.token');
    
    await waitFor(() => {
      const copyButtons = screen.getAllByText('Copy');
      expect(copyButtons.length).toBeGreaterThan(0);
    });
    
    const copyButtons = screen.getAllByText('Copy');
    await user.click(copyButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });
});