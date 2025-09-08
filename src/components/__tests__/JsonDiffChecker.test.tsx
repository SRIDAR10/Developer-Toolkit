import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JsonDiffChecker } from '../JsonDiffChecker';

// Mock jsondiffpatch
vi.mock('jsondiffpatch', () => ({
  create: vi.fn(() => ({
    diff: vi.fn()
  }))
}));

// Mock the utils
vi.mock('../../utils/jsonUtils', () => ({
  validateJson: vi.fn(),
  downloadFile: vi.fn(),
  copyToClipboard: vi.fn()
}));

import { validateJson, downloadFile, copyToClipboard } from '../../utils/jsonUtils';

describe('JsonDiffChecker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all UI elements', () => {
    render(<JsonDiffChecker />);
    
    expect(screen.getByText('JSON Diff Checker')).toBeInTheDocument();
    expect(screen.getByText('Original JSON (Left)')).toBeInTheDocument();
    expect(screen.getByText('Modified JSON (Right)')).toBeInTheDocument();
    expect(screen.getByText('View:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Side by Side')).toBeInTheDocument();
    expect(screen.getAllByText('Upload File')).toHaveLength(2);
  });

  it('should handle left JSON input change', async () => {
    const user = userEvent.setup();
    render(<JsonDiffChecker />);
    
    const leftTextarea = screen.getByPlaceholderText('Paste original JSON here...');
    await user.type(leftTextarea, '{"name":"John"}');
    
    expect(leftTextarea).toHaveValue('{"name":"John"}');
  });

  it('should handle right JSON input change', async () => {
    const user = userEvent.setup();
    render(<JsonDiffChecker />);
    
    const rightTextarea = screen.getByPlaceholderText('Paste modified JSON here...');
    await user.type(rightTextarea, '{"name":"Jane"}');
    
    expect(rightTextarea).toHaveValue('{"name":"Jane"}');
  });

  it('should handle view mode change', async () => {
    const user = userEvent.setup();
    render(<JsonDiffChecker />);
    
    const viewSelect = screen.getByDisplayValue('Side by Side');
    await user.selectOptions(viewSelect, 'inline');
    
    expect(viewSelect).toHaveValue('inline');
  });

  it('should show error for invalid left JSON', async () => {
    const user = userEvent.setup();
    
    (validateJson as any)
      .mockReturnValueOnce({ valid: false, error: 'Invalid JSON syntax' })
      .mockReturnValueOnce({ valid: true, parsed: { name: 'Jane' } });
    
    render(<JsonDiffChecker />);
    
    const leftTextarea = screen.getByPlaceholderText('Paste original JSON here...');
    const rightTextarea = screen.getByPlaceholderText('Paste modified JSON here...');
    
    await user.type(leftTextarea, '{"name":}');
    await user.type(rightTextarea, '{"name":"Jane"}');
    
    await waitFor(() => {
      expect(screen.getByText('Left JSON error: Invalid JSON syntax')).toBeInTheDocument();
    });
  });

  it('should show error for invalid right JSON', async () => {
    const user = userEvent.setup();
    
    (validateJson as any)
      .mockReturnValueOnce({ valid: true, parsed: { name: 'John' } })
      .mockReturnValueOnce({ valid: false, error: 'Invalid JSON syntax' });
    
    render(<JsonDiffChecker />);
    
    const leftTextarea = screen.getByPlaceholderText('Paste original JSON here...');
    const rightTextarea = screen.getByPlaceholderText('Paste modified JSON here...');
    
    await user.type(leftTextarea, '{"name":"John"}');
    await user.type(rightTextarea, '{"name":}');
    
    await waitFor(() => {
      expect(screen.getByText('Right JSON error: Invalid JSON syntax')).toBeInTheDocument();
    });
  });

  it('should show no differences when JSONs are identical', async () => {
    const user = userEvent.setup();
    const sameJson = { name: 'John', age: 30 };
    
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: sameJson 
    });
    
    // Mock jsondiffpatch to return null (no differences)
    const { create } = await import('jsondiffpatch');
    const mockDiff = vi.fn().mockReturnValue(null);
    (create as any).mockReturnValue({ diff: mockDiff });
    
    render(<JsonDiffChecker />);
    
    const leftTextarea = screen.getByPlaceholderText('Paste original JSON here...');
    const rightTextarea = screen.getByPlaceholderText('Paste modified JSON here...');
    
    await user.type(leftTextarea, JSON.stringify(sameJson));
    await user.type(rightTextarea, JSON.stringify(sameJson));
    
    await waitFor(() => {
      expect(screen.getByText('No differences')).toBeInTheDocument();
    });
  });

  it('should show differences when JSONs are different', async () => {
    const user = userEvent.setup();
    const leftJson = { name: 'John', age: 30 };
    const rightJson = { name: 'Jane', age: 30 };
    const mockDelta = { name: ['John', 'Jane'] };
    
    (validateJson as any)
      .mockReturnValueOnce({ valid: true, parsed: leftJson })
      .mockReturnValueOnce({ valid: true, parsed: rightJson });
    
    // Mock jsondiffpatch to return differences
    const { create } = await import('jsondiffpatch');
    const mockDiff = vi.fn().mockReturnValue(mockDelta);
    (create as any).mockReturnValue({ diff: mockDiff });
    
    render(<JsonDiffChecker />);
    
    const leftTextarea = screen.getByPlaceholderText('Paste original JSON here...');
    const rightTextarea = screen.getByPlaceholderText('Paste modified JSON here...');
    
    await user.type(leftTextarea, JSON.stringify(leftJson));
    await user.type(rightTextarea, JSON.stringify(rightJson));
    
    await waitFor(() => {
      expect(screen.getByText('Differences found')).toBeInTheDocument();
    });
  });

  it('should handle copy diff functionality', async () => {
    const user = userEvent.setup();
    const leftJson = { name: 'John' };
    const rightJson = { name: 'Jane' };
    const mockDelta = { name: ['John', 'Jane'] };
    
    (validateJson as any)
      .mockReturnValueOnce({ valid: true, parsed: leftJson })
      .mockReturnValueOnce({ valid: true, parsed: rightJson });
    (copyToClipboard as any).mockResolvedValue(true);
    
    // Mock jsondiffpatch to return differences
    const { create } = await import('jsondiffpatch');
    const mockDiff = vi.fn().mockReturnValue(mockDelta);
    (create as any).mockReturnValue({ diff: mockDiff });
    
    render(<JsonDiffChecker />);
    
    const leftTextarea = screen.getByPlaceholderText('Paste original JSON here...');
    const rightTextarea = screen.getByPlaceholderText('Paste modified JSON here...');
    
    await user.type(leftTextarea, JSON.stringify(leftJson));
    await user.type(rightTextarea, JSON.stringify(rightJson));
    
    await waitFor(() => {
      const copyButton = screen.getByText('Copy Diff');
      expect(copyButton).toBeInTheDocument();
    });
    
    const copyButton = screen.getByText('Copy Diff');
    await user.click(copyButton);
    
    expect(copyToClipboard).toHaveBeenCalledWith(JSON.stringify(mockDelta, null, 2));
  });

  it('should handle download diff functionality', async () => {
    const user = userEvent.setup();
    const leftJson = { name: 'John' };
    const rightJson = { name: 'Jane' };
    const mockDelta = { name: ['John', 'Jane'] };
    
    (validateJson as any)
      .mockReturnValueOnce({ valid: true, parsed: leftJson })
      .mockReturnValueOnce({ valid: true, parsed: rightJson });
    
    // Mock jsondiffpatch to return differences
    const { create } = await import('jsondiffpatch');
    const mockDiff = vi.fn().mockReturnValue(mockDelta);
    (create as any).mockReturnValue({ diff: mockDiff });
    
    render(<JsonDiffChecker />);
    
    const leftTextarea = screen.getByPlaceholderText('Paste original JSON here...');
    const rightTextarea = screen.getByPlaceholderText('Paste modified JSON here...');
    
    await user.type(leftTextarea, JSON.stringify(leftJson));
    await user.type(rightTextarea, JSON.stringify(rightJson));
    
    await waitFor(() => {
      const downloadButton = screen.getByText('Download');
      expect(downloadButton).toBeInTheDocument();
    });
    
    const downloadButton = screen.getByText('Download');
    await user.click(downloadButton);
    
    expect(downloadFile).toHaveBeenCalledWith(
      JSON.stringify(mockDelta, null, 2),
      'diff-result.json'
    );
  });

  it('should handle diff calculation error', async () => {
    const user = userEvent.setup();
    const leftJson = { name: 'John' };
    const rightJson = { name: 'Jane' };
    
    (validateJson as any)
      .mockReturnValueOnce({ valid: true, parsed: leftJson })
      .mockReturnValueOnce({ valid: true, parsed: rightJson });
    
    // Mock jsondiffpatch to throw error
    const { create } = await import('jsondiffpatch');
    const mockDiff = vi.fn().mockImplementation(() => {
      throw new Error('Diff calculation failed');
    });
    (create as any).mockReturnValue({ diff: mockDiff });
    
    render(<JsonDiffChecker />);
    
    const leftTextarea = screen.getByPlaceholderText('Paste original JSON here...');
    const rightTextarea = screen.getByPlaceholderText('Paste modified JSON here...');
    
    await user.type(leftTextarea, JSON.stringify(leftJson));
    await user.type(rightTextarea, JSON.stringify(rightJson));
    
    await waitFor(() => {
      expect(screen.getByText('Diff calculation error: Diff calculation failed')).toBeInTheDocument();
    });
  });

  it('should not show diff controls when no differences', async () => {
    const user = userEvent.setup();
    const sameJson = { name: 'John' };
    
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: sameJson 
    });
    
    // Mock jsondiffpatch to return null (no differences)
    const { create } = await import('jsondiffpatch');
    const mockDiff = vi.fn().mockReturnValue(null);
    (create as any).mockReturnValue({ diff: mockDiff });
    
    render(<JsonDiffChecker />);
    
    const leftTextarea = screen.getByPlaceholderText('Paste original JSON here...');
    const rightTextarea = screen.getByPlaceholderText('Paste modified JSON here...');
    
    await user.type(leftTextarea, JSON.stringify(sameJson));
    await user.type(rightTextarea, JSON.stringify(sameJson));
    
    await waitFor(() => {
      expect(screen.getByText('No differences')).toBeInTheDocument();
      expect(screen.queryByText('Copy Diff')).not.toBeInTheDocument();
      expect(screen.queryByText('Download')).not.toBeInTheDocument();
    });
  });

  it('should handle empty inputs', () => {
    render(<JsonDiffChecker />);
    
    // Should not show any diff results or errors initially
    expect(screen.queryByText('Differences found')).not.toBeInTheDocument();
    expect(screen.queryByText('No differences')).not.toBeInTheDocument();
  });

  it('should show copy success message', async () => {
    const user = userEvent.setup();
    const leftJson = { name: 'John' };
    const rightJson = { name: 'Jane' };
    const mockDelta = { name: ['John', 'Jane'] };
    
    (validateJson as any)
      .mockReturnValueOnce({ valid: true, parsed: leftJson })
      .mockReturnValueOnce({ valid: true, parsed: rightJson });
    (copyToClipboard as any).mockResolvedValue(true);
    
    // Mock jsondiffpatch to return differences
    const { create } = await import('jsondiffpatch');
    const mockDiff = vi.fn().mockReturnValue(mockDelta);
    (create as any).mockReturnValue({ diff: mockDiff });
    
    render(<JsonDiffChecker />);
    
    const leftTextarea = screen.getByPlaceholderText('Paste original JSON here...');
    const rightTextarea = screen.getByPlaceholderText('Paste modified JSON here...');
    
    await user.type(leftTextarea, JSON.stringify(leftJson));
    await user.type(rightTextarea, JSON.stringify(rightJson));
    
    await waitFor(() => {
      const copyButton = screen.getByText('Copy Diff');
      expect(copyButton).toBeInTheDocument();
    });
    
    const copyButton = screen.getByText('Copy Diff');
    await user.click(copyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument();
    });
  });
});