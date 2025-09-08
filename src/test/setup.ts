import '@testing-library/jest-dom';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve(''))
  }
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock FileReader
global.FileReader = class {
  result: string | null = null;
  onload: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  
  readAsText(file: File) {
    setTimeout(() => {
      this.result = 'mocked file content';
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
};

// Mock Blob
global.Blob = class {
  constructor(public parts: any[], public options?: any) {}
  get size() { return 1024; }
  get type() { return this.options?.type || 'application/json'; }
};

// Mock document.execCommand for clipboard fallback
document.execCommand = vi.fn(() => true);