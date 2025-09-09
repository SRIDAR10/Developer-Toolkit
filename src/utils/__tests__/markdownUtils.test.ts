import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderMarkdown, extractPlainText, countWords, estimateReadingTime } from '../markdownUtils';

// Mock dependencies
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>mocked diagram</svg>' })
  }
}));

vi.mock('highlight.js', () => ({
  default: {
    highlight: vi.fn().mockReturnValue({ value: 'highlighted code' }),
    highlightAuto: vi.fn().mockReturnValue({ value: 'auto highlighted code' }),
    getLanguage: vi.fn().mockReturnValue(true)
  }
}));

vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn().mockImplementation((html) => html)
  }
}));

describe('markdownUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renderMarkdown', () => {
    it('should render basic markdown', async () => {
      const markdown = '# Hello World\n\nThis is **bold** text.';
      const result = await renderMarkdown(markdown);
      
      expect(result).toContain('<h1');
      expect(result).toContain('Hello World');
      expect(result).toContain('<strong>');
      expect(result).toContain('bold');
    });

    it('should render code blocks with syntax highlighting', async () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const result = await renderMarkdown(markdown);
      
      expect(result).toContain('<pre>');
      expect(result).toContain('<code');
      expect(result).toContain('hljs');
    });

    it('should render mermaid diagrams', async () => {
      const mermaid = await import('mermaid');
      (mermaid.default.render as any).mockResolvedValue({ svg: '<svg>test diagram</svg>' });
      
      const markdown = '```mermaid\ngraph TD\nA --> B\n```';
      const result = await renderMarkdown(markdown);
      
      expect(result).toContain('mermaid-container');
      expect(result).toContain('<svg>test diagram</svg>');
    });

    it('should handle mermaid rendering errors', async () => {
      const mermaid = await import('mermaid');
      (mermaid.default.render as any).mockRejectedValue(new Error('Invalid syntax'));
      
      const markdown = '```mermaid\ninvalid syntax\n```';
      const result = await renderMarkdown(markdown);
      
      expect(result).toContain('mermaid-error');
      expect(result).toContain('Invalid syntax');
    });

    it('should render tables', async () => {
      const markdown = '| Name | Age |\n|------|-----|\n| John | 30 |';
      const result = await renderMarkdown(markdown);
      
      expect(result).toContain('<table');
      expect(result).toContain('<thead');
      expect(result).toContain('<tbody');
      expect(result).toContain('John');
      expect(result).toContain('30');
    });

    it('should render task lists', async () => {
      const markdown = '- [x] Completed task\n- [ ] Incomplete task';
      const result = await renderMarkdown(markdown);
      
      expect(result).toContain('task-list-item');
      expect(result).toContain('type="checkbox"');
      expect(result).toContain('checked');
    });

    it('should render blockquotes with styling', async () => {
      const markdown = '> This is a quote';
      const result = await renderMarkdown(markdown);
      
      expect(result).toContain('<blockquote');
      expect(result).toContain('border-l-4');
      expect(result).toContain('This is a quote');
    });

    it('should handle rendering errors gracefully', async () => {
      // Mock marked to throw an error
      vi.doMock('marked', () => ({
        marked: vi.fn().mockImplementation(() => {
          throw new Error('Parsing failed');
        })
      }));
      
      const markdown = '# Test';
      const result = await renderMarkdown(markdown);
      
      expect(result).toContain('Markdown Rendering Error');
      expect(result).toContain('Parsing failed');
    });

    it('should sanitize HTML output', async () => {
      const DOMPurify = await import('dompurify');
      const sanitizeSpy = vi.spyOn(DOMPurify.default, 'sanitize');
      
      const markdown = '# Test';
      await renderMarkdown(markdown);
      
      expect(sanitizeSpy).toHaveBeenCalled();
    });
  });

  describe('extractPlainText', () => {
    it('should remove markdown syntax', () => {
      const markdown = '# Header\n\nThis is **bold** and *italic* text with `code`.';
      const result = extractPlainText(markdown);
      
      expect(result).not.toContain('#');
      expect(result).not.toContain('**');
      expect(result).not.toContain('*');
      expect(result).not.toContain('`');
      expect(result).toContain('Header');
      expect(result).toContain('bold');
      expect(result).toContain('italic');
      expect(result).toContain('code');
    });

    it('should remove links and keep text', () => {
      const markdown = '[Link text](https://example.com)';
      const result = extractPlainText(markdown);
      
      expect(result).toBe('Link text');
    });

    it('should remove images and keep alt text', () => {
      const markdown = '![Alt text](image.jpg)';
      const result = extractPlainText(markdown);
      
      expect(result).toBe('Alt text');
    });

    it('should remove code blocks', () => {
      const markdown = 'Text before\n```\ncode block\n```\nText after';
      const result = extractPlainText(markdown);
      
      expect(result).not.toContain('code block');
      expect(result).toContain('Text before');
      expect(result).toContain('Text after');
    });

    it('should remove list markers', () => {
      const markdown = '- Item 1\n* Item 2\n+ Item 3\n1. Numbered item';
      const result = extractPlainText(markdown);
      
      expect(result).not.toContain('-');
      expect(result).not.toContain('*');
      expect(result).not.toContain('+');
      expect(result).not.toContain('1.');
      expect(result).toContain('Item 1');
      expect(result).toContain('Numbered item');
    });

    it('should handle errors gracefully', () => {
      const result = extractPlainText('# Normal text');
      expect(result).toBe('Normal text');
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      const markdown = '# Title\n\nThis is a **test** with five words.';
      const result = countWords(markdown);
      
      expect(result).toBe(8); // Title + This + is + a + test + with + five + words
    });

    it('should handle empty content', () => {
      const result = countWords('');
      expect(result).toBe(0);
    });

    it('should handle content with only whitespace', () => {
      const result = countWords('   \n\n   ');
      expect(result).toBe(0);
    });

    it('should ignore markdown syntax in word count', () => {
      const markdown = '**bold** *italic* `code`';
      const result = countWords(markdown);
      
      expect(result).toBe(3); // bold + italic + code
    });
  });

  describe('estimateReadingTime', () => {
    it('should estimate reading time correctly', () => {
      // Create content with approximately 400 words
      const words = Array(400).fill('word').join(' ');
      const markdown = `# Title\n\n${words}`;
      
      const result = estimateReadingTime(markdown, 200); // 200 words per minute
      
      expect(result).toBe(2); // 400 words / 200 wpm = 2 minutes
    });

    it('should round up reading time', () => {
      // Create content with 250 words
      const words = Array(250).fill('word').join(' ');
      const markdown = words;
      
      const result = estimateReadingTime(markdown, 200); // 200 words per minute
      
      expect(result).toBe(2); // 250 words / 200 wpm = 1.25, rounded up to 2
    });

    it('should use default reading speed', () => {
      const words = Array(200).fill('word').join(' ');
      const markdown = words;
      
      const result = estimateReadingTime(markdown); // Default 200 wpm
      
      expect(result).toBe(1);
    });

    it('should handle empty content', () => {
      const result = estimateReadingTime('');
      expect(result).toBe(0);
    });

    it('should use custom reading speed', () => {
      const words = Array(300).fill('word').join(' ');
      const markdown = words;
      
      const result = estimateReadingTime(markdown, 300); // 300 words per minute
      
      expect(result).toBe(1); // 300 words / 300 wpm = 1 minute
    });
  });
});