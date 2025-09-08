import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock all the components
vi.mock('../components/JsonFormatter', () => ({
  JsonFormatter: () => <div data-testid="json-formatter">JSON Formatter Component</div>
}));

vi.mock('../components/JsonViewer', () => ({
  JsonViewer: () => <div data-testid="json-viewer">JSON Viewer Component</div>
}));

vi.mock('../components/JsonParser', () => ({
  JsonParser: () => <div data-testid="json-parser">JSON Parser Component</div>
}));

vi.mock('../components/JsonDiffChecker', () => ({
  JsonDiffChecker: () => <div data-testid="json-diff-checker">JSON Diff Checker Component</div>
}));

// Mock localStorage for theme
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

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    document.documentElement.classList.remove('dark');
  });

  it('should render header with title and description', () => {
    render(<App />);
    
    expect(screen.getByText('JSON Toolkit')).toBeInTheDocument();
    expect(screen.getByText('Format, View, Parse, and Compare JSON data')).toBeInTheDocument();
  });

  it('should render navigation tabs', () => {
    render(<App />);
    
    expect(screen.getByText('Formatter')).toBeInTheDocument();
    expect(screen.getByText('Viewer')).toBeInTheDocument();
    expect(screen.getByText('Parser')).toBeInTheDocument();
    expect(screen.getByText('Diff Checker')).toBeInTheDocument();
  });

  it('should render theme toggle button', () => {
    render(<App />);
    
    const themeButton = screen.getByLabelText('Toggle theme');
    expect(themeButton).toBeInTheDocument();
  });

  it('should render footer', () => {
    render(<App />);
    
    expect(screen.getByText('A comprehensive client-side JSON toolkit for developers')).toBeInTheDocument();
    expect(screen.getByText(/Built with React, TypeScript, and Tailwind CSS/)).toBeInTheDocument();
  });

  it('should show JSON Formatter by default', () => {
    render(<App />);
    
    expect(screen.getByTestId('json-formatter')).toBeInTheDocument();
    expect(screen.queryByTestId('json-viewer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('json-parser')).not.toBeInTheDocument();
    expect(screen.queryByTestId('json-diff-checker')).not.toBeInTheDocument();
  });

  it('should switch to Viewer tab when clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const viewerTab = screen.getByText('Viewer');
    await user.click(viewerTab);
    
    expect(screen.getByTestId('json-viewer')).toBeInTheDocument();
    expect(screen.queryByTestId('json-formatter')).not.toBeInTheDocument();
  });

  it('should switch to Parser tab when clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const parserTab = screen.getByText('Parser');
    await user.click(parserTab);
    
    expect(screen.getByTestId('json-parser')).toBeInTheDocument();
    expect(screen.queryByTestId('json-formatter')).not.toBeInTheDocument();
  });

  it('should switch to Diff Checker tab when clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const diffTab = screen.getByText('Diff Checker');
    await user.click(diffTab);
    
    expect(screen.getByTestId('json-diff-checker')).toBeInTheDocument();
    expect(screen.queryByTestId('json-formatter')).not.toBeInTheDocument();
  });

  it('should highlight active tab', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const formatterTab = screen.getByText('Formatter');
    const viewerTab = screen.getByText('Viewer');
    
    // Formatter should be active by default
    expect(formatterTab).toHaveClass('border-blue-600', 'text-blue-600');
    expect(viewerTab).toHaveClass('border-transparent');
    
    // Click viewer tab
    await user.click(viewerTab);
    
    expect(viewerTab).toHaveClass('border-blue-600', 'text-blue-600');
    expect(formatterTab).toHaveClass('border-transparent');
  });

  it('should toggle theme when theme button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const themeButton = screen.getByLabelText('Toggle theme');
    
    // Should start in light mode
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    
    await user.click(themeButton);
    
    // Should switch to dark mode
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('should initialize with stored theme preference', () => {
    localStorageMock.getItem.mockReturnValue('dark');
    
    render(<App />);
    
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should have proper tab navigation structure', () => {
    render(<App />);
    
    const tabs = screen.getAllByRole('button').filter(button => 
      ['Formatter', 'Viewer', 'Parser', 'Diff Checker'].includes(button.textContent || '')
    );
    
    expect(tabs).toHaveLength(4);
  });

  it('should render all tab icons', () => {
    render(<App />);
    
    // Check that all tabs have their respective icons (by checking the tab structure)
    const formatterTab = screen.getByText('Formatter').closest('button');
    const viewerTab = screen.getByText('Viewer').closest('button');
    const parserTab = screen.getByText('Parser').closest('button');
    const diffTab = screen.getByText('Diff Checker').closest('button');
    
    expect(formatterTab).toBeInTheDocument();
    expect(viewerTab).toBeInTheDocument();
    expect(parserTab).toBeInTheDocument();
    expect(diffTab).toBeInTheDocument();
  });

  it('should handle tab switching multiple times', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Start with formatter
    expect(screen.getByTestId('json-formatter')).toBeInTheDocument();
    
    // Switch to viewer
    await user.click(screen.getByText('Viewer'));
    expect(screen.getByTestId('json-viewer')).toBeInTheDocument();
    
    // Switch to parser
    await user.click(screen.getByText('Parser'));
    expect(screen.getByTestId('json-parser')).toBeInTheDocument();
    
    // Switch to diff checker
    await user.click(screen.getByText('Diff Checker'));
    expect(screen.getByTestId('json-diff-checker')).toBeInTheDocument();
    
    // Switch back to formatter
    await user.click(screen.getByText('Formatter'));
    expect(screen.getByTestId('json-formatter')).toBeInTheDocument();
  });
});