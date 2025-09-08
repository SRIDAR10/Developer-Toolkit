import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatJson,
  minifyJson,
  validateJson,
  downloadFile,
  copyToClipboard,
  convertJsonToYaml,
  convertJsonToCsv,
  readFileAsText
} from '../jsonUtils';

describe('jsonUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('formatJson', () => {
    it('should format JSON with default indentation', () => {
      const input = '{"name":"John","age":30}';
      const result = formatJson(input);
      expect(result).toBe('{\n  "name": "John",\n  "age": 30\n}');
    });

    it('should format JSON with custom indentation', () => {
      const input = '{"name":"John"}';
      const result = formatJson(input, 4);
      expect(result).toBe('{\n    "name": "John"\n}');
    });

    it('should format JSON with tab indentation', () => {
      const input = '{"name":"John"}';
      const result = formatJson(input, '\t');
      expect(result).toBe('{\n\t"name": "John"\n}');
    });

    it('should throw error for invalid JSON', () => {
      const input = '{"name":}';
      expect(() => formatJson(input)).toThrow();
    });

    it('should handle arrays', () => {
      const input = '[1,2,3]';
      const result = formatJson(input);
      expect(result).toBe('[\n  1,\n  2,\n  3\n]');
    });

    it('should handle nested objects', () => {
      const input = '{"user":{"name":"John","details":{"age":30}}}';
      const result = formatJson(input);
      expect(result).toContain('"user"');
      expect(result).toContain('"name": "John"');
      expect(result).toContain('"age": 30');
    });
  });

  describe('minifyJson', () => {
    it('should minify formatted JSON', () => {
      const input = '{\n  "name": "John",\n  "age": 30\n}';
      const result = minifyJson(input);
      expect(result).toBe('{"name":"John","age":30}');
    });

    it('should handle arrays', () => {
      const input = '[\n  1,\n  2,\n  3\n]';
      const result = minifyJson(input);
      expect(result).toBe('[1,2,3]');
    });

    it('should throw error for invalid JSON', () => {
      const input = '{"name":}';
      expect(() => minifyJson(input)).toThrow();
    });

    it('should handle complex nested structures', () => {
      const input = '{\n  "users": [\n    {"name": "John"},\n    {"name": "Jane"}\n  ]\n}';
      const result = minifyJson(input);
      expect(result).toBe('{"users":[{"name":"John"},{"name":"Jane"}]}');
    });
  });

  describe('validateJson', () => {
    it('should return valid for correct JSON', () => {
      const input = '{"name":"John","age":30}';
      const result = validateJson(input);
      expect(result.valid).toBe(true);
      expect(result.parsed).toEqual({ name: 'John', age: 30 });
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for incorrect JSON', () => {
      const input = '{"name":}';
      const result = validateJson(input);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.parsed).toBeUndefined();
    });

    it('should handle empty string', () => {
      const input = '';
      const result = validateJson(input);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle null values', () => {
      const input = '{"value":null}';
      const result = validateJson(input);
      expect(result.valid).toBe(true);
      expect(result.parsed).toEqual({ value: null });
    });

    it('should handle boolean values', () => {
      const input = '{"active":true,"disabled":false}';
      const result = validateJson(input);
      expect(result.valid).toBe(true);
      expect(result.parsed).toEqual({ active: true, disabled: false });
    });

    it('should handle arrays', () => {
      const input = '[1,"string",true,null]';
      const result = validateJson(input);
      expect(result.valid).toBe(true);
      expect(result.parsed).toEqual([1, 'string', true, null]);
    });
  });

  describe('downloadFile', () => {
    it('should create download link and trigger download', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');
      
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      createElementSpy.mockReturnValue(mockLink as any);

      downloadFile('{"test":true}', 'test.json');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
      expect(mockLink.download).toBe('test.json');
    });

    it('should use custom mime type', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const mockLink = { href: '', download: '', click: vi.fn() };
      createElementSpy.mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      downloadFile('test content', 'test.txt', 'text/plain');

      expect(createElementSpy).toHaveBeenCalled();
    });
  });

  describe('copyToClipboard', () => {
    it('should copy text using clipboard API', async () => {
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
      writeTextSpy.mockResolvedValue();

      const result = await copyToClipboard('test text');

      expect(writeTextSpy).toHaveBeenCalledWith('test text');
      expect(result).toBe(true);
    });

    it('should fallback to execCommand when clipboard API fails', async () => {
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
      writeTextSpy.mockRejectedValue(new Error('Clipboard API failed'));
      
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');
      const execCommandSpy = vi.spyOn(document, 'execCommand');
      
      const mockTextArea = {
        value: '',
        select: vi.fn()
      };
      createElementSpy.mockReturnValue(mockTextArea as any);
      execCommandSpy.mockReturnValue(true);

      const result = await copyToClipboard('test text');

      expect(createElementSpy).toHaveBeenCalledWith('textarea');
      expect(mockTextArea.value).toBe('test text');
      expect(mockTextArea.select).toHaveBeenCalled();
      expect(execCommandSpy).toHaveBeenCalledWith('copy');
      expect(appendChildSpy).toHaveBeenCalledWith(mockTextArea);
      expect(removeChildSpy).toHaveBeenCalledWith(mockTextArea);
      expect(result).toBe(true);
    });

    it('should return false when both methods fail', async () => {
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
      writeTextSpy.mockRejectedValue(new Error('Clipboard API failed'));
      
      const execCommandSpy = vi.spyOn(document, 'execCommand');
      execCommandSpy.mockReturnValue(false);

      const result = await copyToClipboard('test text');

      expect(result).toBe(false);
    });
  });

  describe('convertJsonToYaml', () => {
    it('should convert simple JSON to YAML', () => {
      const input = '{"name":"John","age":30}';
      const result = convertJsonToYaml(input);
      expect(result).toContain('name: John');
      expect(result).toContain('age: 30');
    });

    it('should convert nested JSON to YAML', () => {
      const input = '{"user":{"name":"John","details":{"age":30}}}';
      const result = convertJsonToYaml(input);
      expect(result).toContain('user:');
      expect(result).toContain('name: John');
      expect(result).toContain('details:');
      expect(result).toContain('age: 30');
    });

    it('should convert arrays to YAML', () => {
      const input = '{"items":[1,2,3]}';
      const result = convertJsonToYaml(input);
      expect(result).toContain('items:');
      expect(result).toContain('- 1');
      expect(result).toContain('- 2');
      expect(result).toContain('- 3');
    });

    it('should throw error for invalid JSON', () => {
      const input = '{"name":}';
      expect(() => convertJsonToYaml(input)).toThrow();
    });
  });

  describe('convertJsonToCsv', () => {
    it('should convert array of objects to CSV', () => {
      const input = '[{"name":"John","age":30},{"name":"Jane","age":25}]';
      const result = convertJsonToCsv(input);
      expect(result).toContain('name,age');
      expect(result).toContain('John,30');
      expect(result).toContain('Jane,25');
    });

    it('should convert single object to CSV', () => {
      const input = '{"name":"John","age":30}';
      const result = convertJsonToCsv(input);
      expect(result).toContain('name,age');
      expect(result).toContain('John,30');
    });

    it('should handle empty array', () => {
      const input = '[]';
      const result = convertJsonToCsv(input);
      expect(result).toBe('');
    });

    it('should throw error for invalid JSON', () => {
      const input = '{"name":}';
      expect(() => convertJsonToCsv(input)).toThrow();
    });
  });

  describe('readFileAsText', () => {
    it('should read file content as text', async () => {
      const mockFile = new File(['{"test": true}'], 'test.json', { type: 'application/json' });
      
      const result = await readFileAsText(mockFile);
      
      expect(result).toBe('mocked file content');
    });

    it('should reject on file read error', async () => {
      const mockFile = new File(['{"test": true}'], 'test.json', { type: 'application/json' });
      
      // Mock FileReader to simulate error
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

      await expect(readFileAsText(mockFile)).rejects.toThrow();
      
      global.FileReader = originalFileReader;
    });
  });
});