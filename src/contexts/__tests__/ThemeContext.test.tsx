import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../ThemeContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Test component that uses the theme context
const TestComponent = () => {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="theme-status">{isDark ? 'dark' : 'light'}</div>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provide theme context to children', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-status')).toHaveTextContent('light');
  });

  it('should initialize with stored theme preference', () => {
    localStorageMock.getItem.mockReturnValue('dark');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');
  });

  it('should initialize with system preference when no stored preference', () => {
    localStorageMock.getItem.mockReturnValue(null);
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');
  });

  it('should toggle theme when toggleTheme is called', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-status')).toHaveTextContent('light');

    await user.click(screen.getByTestId('toggle-theme'));

    expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');
  });

  it('should save theme preference to localStorage', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await user.click(screen.getByTestId('toggle-theme'));

    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('should add/remove dark class from document element', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await user.click(screen.getByTestId('toggle-theme'));

    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.click(screen.getByTestId('toggle-theme'));

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should throw error when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');
    
    consoleSpy.mockRestore();
  });

  it('should handle server-side rendering (no window)', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-status')).toHaveTextContent('light');
    
    global.window = originalWindow;
  });

  it('should toggle multiple times correctly', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-theme');
    const themeStatus = screen.getByTestId('theme-status');

    expect(themeStatus).toHaveTextContent('light');

    await user.click(toggleButton);
    expect(themeStatus).toHaveTextContent('dark');

    await user.click(toggleButton);
    expect(themeStatus).toHaveTextContent('light');

    await user.click(toggleButton);
    expect(themeStatus).toHaveTextContent('dark');
  });
});