import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '../FileUpload';

describe('FileUpload', () => {
  it('should render upload button', () => {
    const mockOnFileSelect = vi.fn();
    
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    expect(screen.getByText('Upload File')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should accept custom accept prop', () => {
    const mockOnFileSelect = vi.fn();
    
    render(<FileUpload onFileSelect={mockOnFileSelect} accept=".txt" />);
    
    const fileInput = screen.getByRole('button').parentElement?.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('accept', '.txt');
  });

  it('should use default accept prop when not provided', () => {
    const mockOnFileSelect = vi.fn();
    
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const fileInput = screen.getByRole('button').parentElement?.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('accept', '.json');
  });

  it('should apply custom className', () => {
    const mockOnFileSelect = vi.fn();
    
    render(<FileUpload onFileSelect={mockOnFileSelect} className="custom-class" />);
    
    const container = screen.getByRole('button').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('should trigger file input when button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnFileSelect = vi.fn();
    
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const button = screen.getByRole('button');
    const fileInput = button.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    
    const clickSpy = vi.spyOn(fileInput, 'click');
    
    await user.click(button);
    
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should call onFileSelect when file is selected', async () => {
    const mockOnFileSelect = vi.fn();
    const fileContent = '{"test": true}';
    
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const fileInput = screen.getByRole('button').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([fileContent], 'test.json', { type: 'application/json' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalledWith('mocked file content', 'test.json');
    });
  });

  it('should not call onFileSelect when no file is selected', () => {
    const mockOnFileSelect = vi.fn();
    
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const fileInput = screen.getByRole('button').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(fileInput, { target: { files: [] } });
    
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  it('should reset file input after file selection', async () => {
    const mockOnFileSelect = vi.fn();
    const fileContent = '{"test": true}';
    
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const fileInput = screen.getByRole('button').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([fileContent], 'test.json', { type: 'application/json' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(fileInput.value).toBe('');
    });
  });

  it('should handle file read error gracefully', async () => {
    const mockOnFileSelect = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock FileReader to throw error
    const originalFileReader = global.FileReader;
    global.FileReader = class {
      onerror: ((event: any) => void) | null = null;
      readAsText() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Error('File read error'));
          }
        }, 0);
      }
    } as any;
    
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const fileInput = screen.getByRole('button').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['{"test": true}'], 'test.json', { type: 'application/json' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error reading file:', expect.any(Error));
    });
    
    expect(mockOnFileSelect).not.toHaveBeenCalled();
    
    global.FileReader = originalFileReader;
    consoleSpy.mockRestore();
  });

  it('should have proper accessibility attributes', () => {
    const mockOnFileSelect = vi.fn();
    
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const button = screen.getByRole('button');
    const fileInput = button.parentElement?.querySelector('input[type="file"]');
    
    expect(fileInput).toHaveClass('hidden');
    expect(button).toHaveTextContent('Upload File');
  });
});