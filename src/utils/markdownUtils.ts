import { marked } from 'marked';
import mermaid from 'mermaid';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit'
});

// Configure marked with GitHub Flavored Markdown
marked.setOptions({
  gfm: true,
  breaks: true,
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error('Syntax highlighting error:', err);
      }
    }
    return hljs.highlightAuto(code).value;
  }
});

// Custom renderer for enhanced features
const renderer = new marked.Renderer();

// Override code block rendering to handle mermaid diagrams
renderer.code = function(code, language) {
  if (language === 'mermaid') {
    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
    // Return a placeholder that will be replaced with the actual diagram
    return `<div class="mermaid-diagram" data-mermaid-id="${id}" data-mermaid-code="${encodeURIComponent(code)}"></div>`;
  }
  
  const validLanguage = language && hljs.getLanguage(language) ? language : '';
  const highlighted = validLanguage 
    ? hljs.highlight(code, { language: validLanguage }).value
    : hljs.highlightAuto(code).value;
    
  return `<pre><code class="hljs ${validLanguage}">${highlighted}</code></pre>`;
};

// Override checkbox rendering for task lists
renderer.listitem = function(text, task, checked) {
  if (task) {
    const checkedAttr = checked ? 'checked' : '';
    const checkedClass = checked ? 'line-through opacity-60' : '';
    return `<li class="task-list-item flex items-center gap-2 my-1">
      <input type="checkbox" ${checkedAttr} disabled class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
      <span class="${checkedClass}">${text}</span>
    </li>`;
  }
  return `<li class="my-1">${text}</li>`;
};

// Override table rendering for better styling
renderer.table = function(header, body) {
  return `<div class="overflow-x-auto my-4">
    <table class="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
      <thead class="bg-gray-50 dark:bg-gray-800">${header}</thead>
      <tbody>${body}</tbody>
    </table>
  </div>`;
};

renderer.tablerow = function(content) {
  return `<tr class="border-b border-gray-200 dark:border-gray-700">${content}</tr>`;
};

renderer.tablecell = function(content, flags) {
  const tag = flags.header ? 'th' : 'td';
  const align = flags.align ? ` style="text-align: ${flags.align}"` : '';
  const classes = flags.header 
    ? 'px-4 py-2 font-medium text-gray-900 dark:text-gray-100' 
    : 'px-4 py-2 text-gray-700 dark:text-gray-300';
  
  return `<${tag} class="${classes}"${align}>${content}</${tag}>`;
};

// Override blockquote for better styling
renderer.blockquote = function(quote) {
  return `<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100">${quote}</blockquote>`;
};

// Set the custom renderer
marked.use({ renderer });

/**
 * Renders markdown to HTML with syntax highlighting and mermaid support
 * @param markdown - The markdown content to render
 * @returns Promise<string> - The rendered HTML
 */
export const renderMarkdown = async (markdown: string): Promise<string> => {
  try {
    // First pass: convert markdown to HTML
    let html = marked(markdown);
    
    // Second pass: process mermaid diagrams
    const mermaidRegex = /<div class="mermaid-diagram" data-mermaid-id="([^"]+)" data-mermaid-code="([^"]+)"><\/div>/g;
    const mermaidPromises: Promise<string>[] = [];
    const mermaidMatches: { match: string; id: string; code: string }[] = [];
    
    let match;
    while ((match = mermaidRegex.exec(html)) !== null) {
      const [fullMatch, id, encodedCode] = match;
      const code = decodeURIComponent(encodedCode);
      
      mermaidMatches.push({ match: fullMatch, id, code });
      
      // Create a promise for each mermaid diagram
      const mermaidPromise = new Promise<string>((resolve) => {
        try {
          mermaid.render(id, code).then(({ svg }) => {
            resolve(`<div class="mermaid-container my-4 text-center">${svg}</div>`);
          }).catch((error) => {
            console.error('Mermaid rendering error:', error);
            resolve(`<div class="mermaid-error p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p class="text-red-700 dark:text-red-300 font-medium">Mermaid Diagram Error</p>
              <pre class="text-sm text-red-600 dark:text-red-400 mt-2">${error.message || 'Failed to render diagram'}</pre>
            </div>`);
          });
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          resolve(`<div class="mermaid-error p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <p class="text-red-700 dark:text-red-300 font-medium">Mermaid Diagram Error</p>
            <pre class="text-sm text-red-600 dark:text-red-400 mt-2">${error instanceof Error ? error.message : 'Failed to render diagram'}</pre>
          </div>`);
        }
      });
      
      mermaidPromises.push(mermaidPromise);
    }
    
    // Wait for all mermaid diagrams to render
    if (mermaidPromises.length > 0) {
      const renderedDiagrams = await Promise.all(mermaidPromises);
      
      // Replace placeholders with rendered diagrams
      mermaidMatches.forEach((matchInfo, index) => {
        html = html.replace(matchInfo.match, renderedDiagrams[index]);
      });
    }
    
    // Sanitize the HTML to prevent XSS attacks
    const sanitizedHtml = DOMPurify.sanitize(html, {
      ADD_TAGS: ['svg', 'g', 'path', 'text', 'rect', 'circle', 'line', 'polygon', 'polyline', 'ellipse', 'defs', 'marker', 'foreignObject'],
      ADD_ATTR: ['viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'transform', 'd', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'points', 'x1', 'y1', 'x2', 'y2', 'rx', 'ry', 'class', 'id', 'style', 'marker-end', 'marker-start']
    });
    
    return sanitizedHtml;
  } catch (error) {
    console.error('Markdown rendering error:', error);
    return `<div class="error p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
      <p class="text-red-700 dark:text-red-300 font-medium">Markdown Rendering Error</p>
      <pre class="text-sm text-red-600 dark:text-red-400 mt-2">${error instanceof Error ? error.message : 'Failed to render markdown'}</pre>
    </div>`;
  }
};

/**
 * Extracts plain text from markdown
 * @param markdown - The markdown content
 * @returns Plain text content
 */
export const extractPlainText = (markdown: string): string => {
  try {
    // Remove markdown syntax
    return markdown
      .replace(/#{1,6}\s+/g, '') // Headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`(.*?)`/g, '$1') // Inline code
      .replace(/```[\s\S]*?```/g, '') // Code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Images
      .replace(/>\s+/g, '') // Blockquotes
      .replace(/[-*+]\s+/g, '') // Lists
      .replace(/\d+\.\s+/g, '') // Numbered lists
      .replace(/\n{2,}/g, '\n') // Multiple newlines
      .trim();
  } catch (error) {
    console.error('Error extracting plain text:', error);
    return markdown;
  }
};

/**
 * Counts words in markdown content
 * @param markdown - The markdown content
 * @returns Word count
 */
export const countWords = (markdown: string): number => {
  const plainText = extractPlainText(markdown);
  return plainText.split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Estimates reading time for markdown content
 * @param markdown - The markdown content
 * @param wordsPerMinute - Average reading speed (default: 200)
 * @returns Estimated reading time in minutes
 */
export const estimateReadingTime = (markdown: string, wordsPerMinute: number = 200): number => {
  const wordCount = countWords(markdown);
  return Math.ceil(wordCount / wordsPerMinute);
};