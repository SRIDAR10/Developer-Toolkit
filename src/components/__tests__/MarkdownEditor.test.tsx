import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownEditor } from '../MarkdownEditor';

// Mock the utils
vi.mock('../../utils/markdownUtils', () => ({
  renderMarkdown: vi.fn()
}));

vi.mock('../../utils/jsonUtils', () => ({
  copyToClipboard: vi.fn(),
  downloadFile: vi.fn()
}));

import { renderMarkdown } from '../../utils/markdownUtils';
import { copyToClipboard, downloadFile } from '../../utils/jsonUtils';

describe('MarkdownEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (renderMarkdown as any).mockResolvedValue('<h1>Test HTML</h1>');
  });

  it('should render all UI elements', () => {
    render(<MarkdownEditor />);
    
    expect(screen.getByText('Markdown Editor')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Split')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Upload File')).toBeInTheDocument();
  });

  it('should start in split mode by default', () => {
    render(<MarkdownEditor />);
    
    const splitButton = screen.getByText('Split');
    expect(splitButton).toHaveClass('bg-white');
    expect(screen.getByText('Markdown Editor')).toBeInTheDocument();
    expect(screen.getByText('Live Preview')).toBeInTheDocument();
  });

  it('should switch to edit mode', async () => {
    const user = userEvent.setup();
    render(<MarkdownEditor />);
    
    const editButton = screen.getByText('Edit');
    await user.click(editButton);
    
    expect(editButton).toHaveClass('bg-white');
    expect(screen.getByText('Markdown Editor')).toBeInTheDocument();
    expect(screen.queryByText('Live Preview')).not.toBeInTheDocument();
  });

  it('should switch to preview mode', async () => {
    const user = userEvent.setup();
    render(<MarkdownEditor />);
    
    const previewButton = screen.getByText('Preview');
    await user.click(previewButton);
    
    expect(previewButton).toHaveClass('bg-white');
    expect(screen.getByText('Live Preview')).toBeInTheDocument();
    expect(screen.queryByText('Markdown Editor')).not.toBeInTheDocument();
  });

  it('should handle markdown input change', async () => {
    const user = userEvent.setup();
    render(<MarkdownEditor />);
    
    const textarea = screen.getByPlaceholderText('Write your markdown here...');
    await user.clear(textarea);
    await user.type(textarea, '# New Title');
    
    expect(textarea).toHaveValue('# New Title');
  });

  it('should render markdown preview', async () => {
    (renderMarkdown as any).mockResolvedValue('<h1>Test Title</h1>');
    
    render(<MarkdownEditor />);
    
    await waitFor(() => {
      expect(renderMarkdown).toHaveBeenCalled();
    });
  });

  it('should handle copy markdown functionality', async () => {
    const user = userEvent.setup();
    (copyToClipboard as any).mockResolvedValue(true);
    
    render(<MarkdownEditor />);
    
    const copyMdButton = screen.getByText('Copy MD');
    await user.click(copyMdButton);
    
    expect(copyToClipboard).toHaveBeenCalled();
  });

  it('should handle copy HTML functionality', async () => {
    const user = userEvent.setup();
    (copyToClipboard as any).mockResolvedValue(true);
    (renderMarkdown as any).mockResolvedValue('<h1>Test HTML</h1>');
    
    render(<MarkdownEditor />);
    
    await waitFor(() => {
      const copyHtmlButton = screen.getByText('Copy HTML');
      expect(copyHtmlButton).toBeInTheDocument();
    });
    
    const copyHtmlButton = screen.getByText('Copy HTML');
    await user.click(copyHtmlButton);
    
    expect(copyToClipboard).toHaveBeenCalledWith('<h1>Test HTML</h1>');
  });

  it('should handle download markdown functionality', async () => {
    const user = userEvent.setup();
    
    render(<MarkdownEditor />);
    
    const downloadMdButton = screen.getByText('.md');
    await user.click(downloadMdButton);
    
    expect(downloadFile).toHaveBeenCalledWith(
      expect.any(String),
      'document.md',
      'text/markdown'
    );
  });

  it('should handle download HTML functionality', async () => {
    const user = userEvent.setup();
    (renderMarkdown as any).mockResolvedValue('<h1>Test HTML</h1>');
    
    render(<MarkdownEditor />);
    
    await waitFor(() => {
      const downloadHtmlButton = screen.getByText('.html');
      expect(downloadHtmlButton).toBeInTheDocument();
    });
    
    const downloadHtmlButton = screen.getByText('.html');
    await user.click(downloadHtmlButton);
    
    expect(downloadFile).toHaveBeenCalledWith(
      expect.stringContaining('<h1>Test HTML</h1>'),
      'document.html',
      'text/html'
    );
  });

  it('should show copy success message', async () => {
    const user = userEvent.setup();
    (copyToClipboard as any).mockResolvedValue(true);
    
    render(<MarkdownEditor />);
    
    const copyMdButton = screen.getByText('Copy MD');
    await user.click(copyMdButton);
    
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('should handle file upload', async () => {
    render(<MarkdownEditor />);
    
    const fileUploadButton = screen.getByText('Upload File');
    expect(fileUploadButton).toBeInTheDocument();
  });

  it('should display help text', () => {
    render(<MarkdownEditor />);
    
    expect(screen.getByText(/This editor supports GitHub Flavored Markdown/)).toBeInTheDocument();
    expect(screen.getByText(/Use.*```mermaid.*to create diagrams/)).toBeInTheDocument();
  });

  it('should handle markdown rendering errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (renderMarkdown as any).mockRejectedValue(new Error('Rendering failed'));
    
    render(<MarkdownEditor />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error rendering markdown:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('should have proper accessibility attributes', () => {
    render(<MarkdownEditor />);
    
    const textarea = screen.getByPlaceholderText('Write your markdown here...');
    expect(textarea).toHaveAttribute('aria-label', 'Markdown Content');
    
    const editButton = screen.getByText('Edit');
    expect(editButton).toHaveAttribute('aria-label', 'Edit Mode');
    
    const splitButton = screen.getByText('Split');
    expect(splitButton).toHaveAttribute('aria-label', 'Split Mode');
    
    const previewButton = screen.getByText('Preview');
    expect(previewButton).toHaveAttribute('aria-label', 'Preview Mode');
  });

  it('should render default markdown content', () => {
    render(<MarkdownEditor />);
    
    const textarea = screen.getByPlaceholderText('Write your markdown here...');
    expect(textarea.value).toContain('# Welcome to Markdown Editor');
    expect(textarea.value).toContain('GitHub Flavored Markdown');
    expect(textarea.value).toContain('```mermaid');
  });

  it('should handle view mode changes correctly', async () => {
    const user = userEvent.setup();
    render(<MarkdownEditor />);
    
    // Start in split mode
    expect(screen.getByText('Markdown Editor')).toBeInTheDocument();
    expect(screen.getByText('Live Preview')).toBeInTheDocument();
    
    // Switch to edit mode
    await user.click(screen.getByText('Edit'));
    expect(screen.getByText('Markdown Editor')).toBeInTheDocument();
    expect(screen.queryByText('Live Preview')).not.toBeInTheDocument();
    
    // Switch to preview mode
    await user.click(screen.getByText('Preview'));
    expect(screen.queryByText('Markdown Editor')).not.toBeInTheDocument();
    expect(screen.getByText('Live Preview')).toBeInTheDocument();
    
    // Switch back to split mode
    await user.click(screen.getByText('Split'));
    expect(screen.getByText('Markdown Editor')).toBeInTheDocument();
    expect(screen.getByText('Live Preview')).toBeInTheDocument();
  });
});