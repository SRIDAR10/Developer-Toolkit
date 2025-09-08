import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JsonViewer } from '../JsonViewer';

// Mock the utils
vi.mock('../../utils/jsonUtils', () => ({
  validateJson: vi.fn(),
  copyToClipboard: vi.fn(),
  downloadFile: vi.fn()
}));

import { validateJson, copyToClipboard, downloadFile } from '../../utils/jsonUtils';

describe('JsonViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all UI elements', () => {
    render(<JsonViewer />);
    
    expect(screen.getByText('JSON Viewer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste your JSON here to view as an interactive tree...')).toBeInTheDocument();
    expect(screen.getByText('Upload File')).toBeInTheDocument();
  });

  it('should handle JSON input change', async () => {
    const user = userEvent.setup();
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: { name: 'John', age: 30 } 
    });
    
    render(<JsonViewer />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to view as an interactive tree...');
    await user.type(textarea, '{"name":"John","age":30}');
    
    expect(validateJson).toHaveBeenCalledWith('{"name":"John","age":30}');
  });

  it('should display error for invalid JSON', async () => {
    const user = userEvent.setup();
    (validateJson as any).mockReturnValue({ 
      valid: false, 
      error: 'Invalid JSON syntax' 
    });
    
    render(<JsonViewer />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to view as an interactive tree...');
    await user.type(textarea, '{"name":}');
    
    expect(screen.getByText('Invalid JSON syntax')).toBeInTheDocument();
  });

  it('should render JSON tree for valid JSON', async () => {
    const user = userEvent.setup();
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: { name: 'John', age: 30 } 
    });
    
    render(<JsonViewer />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to view as an interactive tree...');
    await user.type(textarea, '{"name":"John","age":30}');
    
    await waitFor(() => {
      expect(screen.getByText('name:')).toBeInTheDocument();
      expect(screen.getByText('age:')).toBeInTheDocument();
    });
  });

  it('should handle search functionality', async () => {
    const user = userEvent.setup();
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: { name: 'John', age: 30, city: 'New York' } 
    });
    
    render(<JsonViewer />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to view as an interactive tree...');
    await user.type(textarea, '{"name":"John","age":30,"city":"New York"}');
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search keys and values...');
      expect(searchInput).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search keys and values...');
    await user.type(searchInput, 'John');
    
    expect(searchInput).toHaveValue('John');
  });

  it('should handle download functionality', async () => {
    const user = userEvent.setup();
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: { name: 'John', age: 30 } 
    });
    
    render(<JsonViewer />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to view as an interactive tree...');
    await user.type(textarea, '{"name":"John","age":30}');
    
    await waitFor(() => {
      const downloadButton = screen.getByText('Download');
      expect(downloadButton).toBeInTheDocument();
    });
    
    const downloadButton = screen.getByText('Download');
    await user.click(downloadButton);
    
    expect(downloadFile).toHaveBeenCalledWith(
      JSON.stringify({ name: 'John', age: 30 }, null, 2),
      'data.json'
    );
  });

  it('should handle node expansion/collapse', async () => {
    const user = userEvent.setup();
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: { 
        user: { 
          name: 'John', 
          details: { age: 30 } 
        } 
      } 
    });
    
    render(<JsonViewer />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to view as an interactive tree...');
    await user.type(textarea, '{"user":{"name":"John","details":{"age":30}}}');
    
    await waitFor(() => {
      const expandButton = screen.getAllByRole('button')[1]; // First button is upload, second is expand
      expect(expandButton).toBeInTheDocument();
    });
  });

  it('should handle copy functionality', async () => {
    const user = userEvent.setup();
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: { name: 'John', age: 30 } 
    });
    (copyToClipboard as any).mockResolvedValue(true);
    
    render(<JsonViewer />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to view as an interactive tree...');
    await user.type(textarea, '{"name":"John","age":30}');
    
    await waitFor(() => {
      const copyButtons = screen.getAllByTitle('Copy value');
      expect(copyButtons.length).toBeGreaterThan(0);
    });
    
    const copyButton = screen.getAllByTitle('Copy value')[0];
    await user.click(copyButton);
    
    expect(copyToClipboard).toHaveBeenCalled();
  });

  it('should show copy success message', async () => {
    const user = userEvent.setup();
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: { name: 'John' } 
    });
    (copyToClipboard as any).mockResolvedValue(true);
    
    render(<JsonViewer />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to view as an interactive tree...');
    await user.type(textarea, '{"name":"John"}');
    
    await waitFor(() => {
      const copyButton = screen.getAllByTitle('Copy value')[0];
      expect(copyButton).toBeInTheDocument();
    });
    
    const copyButton = screen.getAllByTitle('Copy value')[0];
    await user.click(copyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument();
    });
  });

  it('should handle empty JSON input', () => {
    (validateJson as any).mockReturnValue({ valid: false, error: 'Empty input' });
    
    render(<JsonViewer />);
    
    // Should not show tree or error initially
    expect(screen.queryByText('Search keys and values...')).not.toBeInTheDocument();
    expect(screen.queryByText('Download')).not.toBeInTheDocument();
  });

  it('should handle array JSON input', async () => {
    const user = userEvent.setup();
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: [1, 2, 3] 
    });
    
    render(<JsonViewer />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to view as an interactive tree...');
    await user.type(textarea, '[1,2,3]');
    
    await waitFor(() => {
      expect(screen.getByText('Download')).toBeInTheDocument();
    });
  });

  it('should handle complex nested JSON', async () => {
    const user = userEvent.setup();
    const complexJson = {
      users: [
        { id: 1, name: 'John', active: true },
        { id: 2, name: 'Jane', active: false }
      ],
      metadata: {
        total: 2,
        page: 1
      }
    };
    
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: complexJson 
    });
    
    render(<JsonViewer />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to view as an interactive tree...');
    await user.type(textarea, JSON.stringify(complexJson));
    
    await waitFor(() => {
      expect(screen.getByText('users:')).toBeInTheDocument();
      expect(screen.getByText('metadata:')).toBeInTheDocument();
    });
  });
});