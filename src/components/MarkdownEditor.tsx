import React, { useState, useCallback, useEffect } from 'react';
import { Eye, Edit, Copy, Download, FileText, Split } from 'lucide-react';
import { renderMarkdown } from '../utils/markdownUtils';
import { copyToClipboard, downloadFile } from '../utils/jsonUtils';
import { FileUpload } from './FileUpload';

export const MarkdownEditor: React.FC = () => {
  const [markdown, setMarkdown] = useState(`# Welcome to Markdown Editor

This is a **live preview** markdown editor with support for:

## Features
- [x] GitHub Flavored Markdown
- [x] Live preview
- [x] Syntax highlighting
- [x] Mermaid diagrams
- [ ] More features coming soon

## Code Example
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

## Table Example
| Feature | Status |
|---------|--------|
| Tables | ✅ |
| Lists | ✅ |
| Links | ✅ |

## Mermaid Diagram
\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
\`\`\`

> **Note**: This editor supports real-time preview and export functionality.
`);

  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [renderedHtml, setRenderedHtml] = useState('');
  const [copySuccess, setCopySuccess] = useState<string>('');

  // Render markdown whenever content changes
  useEffect(() => {
    const renderContent = async () => {
      try {
        const html = await renderMarkdown(markdown);
        setRenderedHtml(html);
      } catch (error) {
        console.error('Error rendering markdown:', error);
        setRenderedHtml('<p>Error rendering markdown</p>');
      }
    };

    renderContent();
  }, [markdown]);

  const handleCopy = useCallback(async (content: string, type: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
    }
  }, []);

  const handleDownloadMarkdown = useCallback(() => {
    downloadFile(markdown, 'document.md', 'text/markdown');
  }, [markdown]);

  const handleDownloadHtml = useCallback(() => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Document</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
        pre { background: #f6f8fa; padding: 1rem; border-radius: 6px; overflow-x: auto; }
        code { background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 3px; font-size: 85%; }
        blockquote { border-left: 4px solid #dfe2e5; padding-left: 1rem; margin-left: 0; color: #6a737d; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #dfe2e5; padding: 0.5rem; text-align: left; }
        th { background: #f6f8fa; }
    </style>
</head>
<body>
${renderedHtml}
</body>
</html>`;
    downloadFile(fullHtml, 'document.html', 'text/html');
  }, [renderedHtml]);

  const handleFileSelect = useCallback((content: string, filename: string) => {
    setMarkdown(content);
  }, []);

  const renderEditor = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Markdown Editor
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(markdown, 'markdown')}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            aria-label="Copy Markdown"
          >
            <Copy size={12} />
            {copySuccess === 'markdown' ? 'Copied!' : 'Copy MD'}
          </button>
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            aria-label="Download Markdown"
          >
            <Download size={12} />
            .md
          </button>
        </div>
      </div>
      <textarea
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Write your markdown here..."
        aria-label="Markdown Content"
      />
    </div>
  );

  const renderPreview = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Live Preview
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(renderedHtml, 'html')}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            aria-label="Copy HTML"
          >
            <Copy size={12} />
            {copySuccess === 'html' ? 'Copied!' : 'Copy HTML'}
          </button>
          <button
            onClick={handleDownloadHtml}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            aria-label="Download HTML"
          >
            <Download size={12} />
            .html
          </button>
        </div>
      </div>
      <div
        className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 overflow-auto prose prose-sm dark:prose-invert max-w-none text-gray-900 dark:text-white"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
        aria-label="Markdown Preview"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Markdown Editor
          </h2>

          {/* View Mode Controls */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${viewMode === 'edit'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              aria-label="Edit Mode"
            >
              <Edit size={14} />
              Edit
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${viewMode === 'split'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              aria-label="Split Mode"
            >
              <Split size={14} />
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${viewMode === 'preview'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              aria-label="Preview Mode"
            >
              <Eye size={14} />
              Preview
            </button>
          </div>

          <FileUpload
            onFileSelect={handleFileSelect}
            accept=".md,.txt"
            className="ml-auto"
          />
        </div>

        {/* Editor/Preview Layout */}
        <div className="h-96 lg:h-[600px]">
          {viewMode === 'edit' && (
            <div className="h-full overflow-auto">{renderEditor()}</div>
          )}
          {viewMode === 'preview' && (
            <div className="h-full overflow-auto">{renderPreview()}</div>
          )}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              <div className="h-full overflow-auto">{renderEditor()}</div>
              <div className="h-full overflow-auto">{renderPreview()}</div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            <strong>Tip:</strong> This editor supports GitHub Flavored Markdown including tables, task lists,
            code blocks with syntax highlighting, and Mermaid diagrams. Use <code>```mermaid</code> to create diagrams.
          </p>
        </div>
      </div>
    </div>
  );
};