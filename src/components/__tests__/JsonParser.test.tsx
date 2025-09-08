import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JsonParser } from '../JsonParser';

// Mock the utils
vi.mock('../../utils/jsonUtils', () => ({
  validateJson: vi.fn(),
  convertJsonToYaml: vi.fn(),
  convertJsonToCsv: vi.fn(),
  downloadFile: vi.fn()
}));

import { validateJson, convertJsonToYaml, convertJsonToCsv, downloadFile } from '../../utils/jsonUtils';

describe('JsonParser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all UI elements', () => {
    render(<JsonParser />);
    
    expect(screen.getByText('JSON Parser & Converter')).toBeInTheDocument();
    expect(screen.getByText('Input JSON')).toBeInTheDocument();
    expect(screen.getByText('Output Format:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('JSON')).toBeInTheDocument();
    expect(screen.getByText('Parse & Convert')).toBeInTheDocument();
    expect(screen.getByText('Upload File')).toBeInTheDocument();
  });

  it('should handle JSON input change', async () => {
    const user = userEvent.setup();
    render(<JsonParser />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to parse and convert...');
    await user.type(textarea, '{"test": true}');
    
    expect(textarea).toHaveValue('{"test": true}');
  });

  it('should handle output format change', async () => {
    const user = userEvent.setup();
    render(<JsonParser />);
    
    const formatSelect = screen.getByDisplayValue('JSON');
    await user.selectOptions(formatSelect, 'yaml');
    
    expect(formatSelect).toHaveValue('yaml');
  });

  it('should parse and convert valid JSON to JSON format', async () => {
    const user = userEvent.setup();
    const testJson = { name: 'John', age: 30 };
    
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: testJson 
    });
    
    render(<JsonParser />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to parse and convert...');
    await user.type(textarea, JSON.stringify(testJson));
    
    const parseButton = screen.getByText('Parse & Convert');
    await user.click(parseButton);
    
    expect(validateJson).toHaveBeenCalledWith(JSON.stringify(testJson));
    
    await waitFor(() => {
      expect(screen.getByText('Valid JSON')).toBeInTheDocument();
      expect(screen.getByText('Object')).toBeInTheDocument();
    });
  });

  it('should parse and convert valid JSON to YAML format', async () => {
    const user = userEvent.setup();
    const testJson = { name: 'John', age: 30 };
    const yamlOutput = 'name: John\nage: 30\n';
    
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: testJson 
    });
    (convertJsonToYaml as any).mockReturnValue(yamlOutput);
    
    render(<JsonParser />);
    
    const formatSelect = screen.getByDisplayValue('JSON');
    await user.selectOptions(formatSelect, 'yaml');
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to parse and convert...');
    await user.type(textarea, JSON.stringify(testJson));
    
    const parseButton = screen.getByText('Parse & Convert');
    await user.click(parseButton);
    
    expect(convertJsonToYaml).toHaveBeenCalledWith(JSON.stringify(testJson));
    
    await waitFor(() => {
      expect(screen.getByDisplayValue(yamlOutput)).toBeInTheDocument();
    });
  });

  it('should parse and convert valid JSON to CSV format', async () => {
    const user = userEvent.setup();
    const testJson = [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }];
    const csvOutput = 'name,age\nJohn,30\nJane,25';
    
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: testJson 
    });
    (convertJsonToCsv as any).mockReturnValue(csvOutput);
    
    render(<JsonParser />);
    
    const formatSelect = screen.getByDisplayValue('JSON');
    await user.selectOptions(formatSelect, 'csv');
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to parse and convert...');
    await user.type(textarea, JSON.stringify(testJson));
    
    const parseButton = screen.getByText('Parse & Convert');
    await user.click(parseButton);
    
    expect(convertJsonToCsv).toHaveBeenCalledWith(JSON.stringify(testJson));
    
    await waitFor(() => {
      expect(screen.getByDisplayValue(csvOutput)).toBeInTheDocument();
    });
  });

  it('should handle invalid JSON input', async () => {
    const user = userEvent.setup();
    
    (validateJson as any).mockReturnValue({ 
      valid: false, 
      error: 'Unexpected token } in JSON' 
    });
    
    render(<JsonParser />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to parse and convert...');
    await user.type(textarea, '{"name":}');
    
    const parseButton = screen.getByText('Parse & Convert');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
      expect(screen.getByText('Unexpected token } in JSON')).toBeInTheDocument();
    });
  });

  it('should handle empty input', async () => {
    const user = userEvent.setup();
    render(<JsonParser />);
    
    const parseButton = screen.getByText('Parse & Convert');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
      expect(screen.getByText('Please enter JSON to parse')).toBeInTheDocument();
    });
  });

  it('should display parse information for array', async () => {
    const user = userEvent.setup();
    const testArray = [1, 2, 3];
    
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: testArray 
    });
    
    render(<JsonParser />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to parse and convert...');
    await user.type(textarea, JSON.stringify(testArray));
    
    const parseButton = screen.getByText('Parse & Convert');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('Valid JSON')).toBeInTheDocument();
      expect(screen.getByText('Array')).toBeInTheDocument();
    });
  });

  it('should display key count for objects', async () => {
    const user = userEvent.setup();
    const testObject = { name: 'John', age: 30, city: 'New York' };
    
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: testObject 
    });
    
    render(<JsonParser />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to parse and convert...');
    await user.type(textarea, JSON.stringify(testObject));
    
    const parseButton = screen.getByText('Parse & Convert');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Key count
    });
  });

  it('should handle download functionality', async () => {
    const user = userEvent.setup();
    const testJson = { name: 'John', age: 30 };
    
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: testJson 
    });
    
    render(<JsonParser />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to parse and convert...');
    await user.type(textarea, JSON.stringify(testJson));
    
    const parseButton = screen.getByText('Parse & Convert');
    await user.click(parseButton);
    
    await waitFor(() => {
      const downloadButton = screen.getByText('Download');
      expect(downloadButton).toBeInTheDocument();
    });
    
    const downloadButton = screen.getByText('Download');
    await user.click(downloadButton);
    
    expect(downloadFile).toHaveBeenCalledWith(
      JSON.stringify(testJson, null, 2),
      'parsed.json',
      'application/json'
    );
  });

  it('should handle conversion error', async () => {
    const user = userEvent.setup();
    const testJson = { name: 'John', age: 30 };
    
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: testJson 
    });
    (convertJsonToYaml as any).mockImplementation(() => {
      throw new Error('YAML conversion failed');
    });
    
    render(<JsonParser />);
    
    const formatSelect = screen.getByDisplayValue('JSON');
    await user.selectOptions(formatSelect, 'yaml');
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to parse and convert...');
    await user.type(textarea, JSON.stringify(testJson));
    
    const parseButton = screen.getByText('Parse & Convert');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
      expect(screen.getByText('Conversion error: YAML conversion failed')).toBeInTheDocument();
    });
  });

  it('should disable download button when no output', () => {
    render(<JsonParser />);
    
    const downloadButton = screen.getByText('Download');
    expect(downloadButton).toBeDisabled();
  });

  it('should show schema information', async () => {
    const user = userEvent.setup();
    const complexJson = {
      users: [{ name: 'John', age: 30 }],
      metadata: { total: 1 }
    };
    
    (validateJson as any).mockReturnValue({ 
      valid: true, 
      parsed: complexJson 
    });
    
    render(<JsonParser />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON here to parse and convert...');
    await user.type(textarea, JSON.stringify(complexJson));
    
    const parseButton = screen.getByText('Parse & Convert');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('Schema:')).toBeInTheDocument();
    });
  });
});