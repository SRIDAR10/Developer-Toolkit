import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JsonFormatter } from '../JsonFormatter';

// Mock the utils
vi.mock('../../utils/jsonUtils', () => ({
  formatJson: vi.fn(),
  minifyJson: vi.fn(),
  validateJson: vi.fn(),
  downloadFile: vi.fn(),
  copyToClipboard: vi.fn()
}));

// Mock the hooks
vi.mock('../../hooks/useUndoRedo', () => ({
  useUndoRedo: vi.fn()
}));

import { formatJson, minifyJson, validateJson, downloadFile, copyToClipboard } from '../../utils/jsonUtils';
import { useUndoRedo } from '../../hooks/useUndoRedo';

describe('JsonFormatter', () => {
  const mockUndoRedo = {
    value: '',
    set: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
    reset: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useUndoRedo as any).mockReturnValue(mockUndoRedo);
  });

  it('should render all UI elements', () => {
    render(<JsonFormatter />);
    
    expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
    expect(screen.getByText('Input JSON')).toBeInTheDocument();
    expect(screen.getByText('Formatted Output')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste your JSON here...')).toBeInTheDocument();
    expect(screen.getByText('Format')).toBeInTheDocument();
    expect(screen.getByText('Minify')).toBeInTheDocument();
    expect(screen.getByText('Upload File')).toBeInTheDocument();
  });

  it('should handle input change', async () => {
    const user = userEvent.setup();
    render(<JsonFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here...');
    await user.type(textarea, '{"test": true}');
    
    expect(mockUndoRedo.set).toHaveBeenCalledWith('{"test": true}');
  });

  it('should handle format button click with valid JSON', async () => {
    const user = userEvent.setup();
    mockUndoRedo.value = '{"test":true}';
    (validateJson as any).mockReturnValue({ valid: true, parsed: { test: true } });
    (formatJson as any).mockReturnValue('{\n  "test": true\n}');
    
    render(<JsonFormatter />);
    
    const formatButton = screen.getByText('Format');
    await user.click(formatButton);
    
    expect(validateJson).toHaveBeenCalledWith('{"test":true}');
    expect(formatJson).toHaveBeenCalledWith('{"test":true}', 2);
  });

  it('should handle format button click with invalid JSON', async () => {
    const user = userEvent.setup();
    mockUndoRedo.value = '{"test":}';
    (validateJson as any).mockReturnValue({ valid: false, error: 'Invalid JSON' });
    
    render(<JsonFormatter />);
    
    const formatButton = screen.getByText('Format');
    await user.click(formatButton);
    
    expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
  });

  it('should handle minify button click with valid JSON', async () => {
    const user = userEvent.setup();
    mockUndoRedo.value = '{\n  "test": true\n}';
    (validateJson as any).mockReturnValue({ valid: true, parsed: { test: true } });
    (minifyJson as any).mockReturnValue('{"test":true}');
    
    render(<JsonFormatter />);
    
    const minifyButton = screen.getByText('Minify');
    await user.click(minifyButton);
    
    expect(validateJson).toHaveBeenCalledWith('{\n  "test": true\n}');
    expect(minifyJson).toHaveBeenCalledWith('{\n  "test": true\n}');
  });

  it('should handle empty input for format', async () => {
    const user = userEvent.setup();
    mockUndoRedo.value = '';
    
    render(<JsonFormatter />);
    
    const formatButton = screen.getByText('Format');
    await user.click(formatButton);
    
    expect(screen.getByText('Please enter JSON to format')).toBeInTheDocument();
  });

  it('should handle empty input for minify', async () => {
    const user = userEvent.setup();
    mockUndoRedo.value = '';
    
    render(<JsonFormatter />);
    
    const minifyButton = screen.getByText('Minify');
    await user.click(minifyButton);
    
    expect(screen.getByText('Please enter JSON to minify')).toBeInTheDocument();
  });

  it('should handle indent selection change', async () => {
    const user = userEvent.setup();
    render(<JsonFormatter />);
    
    const indentSelect = screen.getByDisplayValue('2 spaces');
    await user.selectOptions(indentSelect, '4');
    
    expect(indentSelect).toHaveValue('4');
  });

  it('should handle copy button click', async () => {
    const user = userEvent.setup();
    (copyToClipboard as any).mockResolvedValue(true);
    
    render(<JsonFormatter />);
    
    // First format some JSON to have output
    mockUndoRedo.value = '{"test":true}';
    (validateJson as any).mockReturnValue({ valid: true, parsed: { test: true } });
    (formatJson as any).mockReturnValue('{\n  "test": true\n}');
    
    const formatButton = screen.getByText('Format');
    await user.click(formatButton);
    
    const copyButton = screen.getByText('Copy');
    await user.click(copyButton);
    
    expect(copyToClipboard).toHaveBeenCalledWith('{\n  "test": true\n}');
    
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('should handle download button click', async () => {
    const user = userEvent.setup();
    
    render(<JsonFormatter />);
    
    // First format some JSON to have output
    mockUndoRedo.value = '{"test":true}';
    (validateJson as any).mockReturnValue({ valid: true, parsed: { test: true } });
    (formatJson as any).mockReturnValue('{\n  "test": true\n}');
    
    const formatButton = screen.getByText('Format');
    await user.click(formatButton);
    
    const downloadButton = screen.getByText('Download');
    await user.click(downloadButton);
    
    expect(downloadFile).toHaveBeenCalledWith('{\n  "test": true\n}', 'formatted.json');
  });

  it('should handle undo button click', async () => {
    const user = userEvent.setup();
    mockUndoRedo.canUndo = true;
    
    render(<JsonFormatter />);
    
    const undoButton = screen.getByTitle('Undo');
    await user.click(undoButton);
    
    expect(mockUndoRedo.undo).toHaveBeenCalled();
  });

  it('should handle redo button click', async () => {
    const user = userEvent.setup();
    mockUndoRedo.canRedo = true;
    
    render(<JsonFormatter />);
    
    const redoButton = screen.getByTitle('Redo');
    await user.click(redoButton);
    
    expect(mockUndoRedo.redo).toHaveBeenCalled();
  });

  it('should disable undo/redo buttons when not available', () => {
    mockUndoRedo.canUndo = false;
    mockUndoRedo.canRedo = false;
    
    render(<JsonFormatter />);
    
    const undoButton = screen.getByTitle('Undo');
    const redoButton = screen.getByTitle('Redo');
    
    expect(undoButton).toBeDisabled();
    expect(redoButton).toBeDisabled();
  });

  it('should handle file upload', async () => {
    render(<JsonFormatter />);
    
    // Simulate file upload by finding the FileUpload component and triggering its callback
    const fileUploadButton = screen.getByText('Upload File');
    expect(fileUploadButton).toBeInTheDocument();
    
    // The actual file upload testing would require more complex mocking
    // This test verifies the component renders the FileUpload component
  });

  it('should handle formatting error', async () => {
    const user = userEvent.setup();
    mockUndoRedo.value = '{"test":true}';
    (validateJson as any).mockReturnValue({ valid: true, parsed: { test: true } });
    (formatJson as any).mockImplementation(() => {
      throw new Error('Formatting error');
    });
    
    render(<JsonFormatter />);
    
    const formatButton = screen.getByText('Format');
    await user.click(formatButton);
    
    expect(screen.getByText('Formatting error')).toBeInTheDocument();
  });

  it('should handle minification error', async () => {
    const user = userEvent.setup();
    mockUndoRedo.value = '{"test":true}';
    (validateJson as any).mockReturnValue({ valid: true, parsed: { test: true } });
    (minifyJson as any).mockImplementation(() => {
      throw new Error('Minification error');
    });
    
    render(<JsonFormatter />);
    
    const minifyButton = screen.getByText('Minify');
    await user.click(minifyButton);
    
    expect(screen.getByText('Minification error')).toBeInTheDocument();
  });

  it('should disable copy and download buttons when no output', () => {
    render(<JsonFormatter />);
    
    const copyButton = screen.getByText('Copy');
    const downloadButton = screen.getByText('Download');
    
    expect(copyButton).toBeDisabled();
    expect(downloadButton).toBeDisabled();
  });
});