import React, { useState, useCallback } from 'react';
import { Copy, Download, Upload, RotateCcw, RotateCw } from 'lucide-react';
import { formatJson, minifyJson, validateJson, downloadFile, copyToClipboard } from '../utils/jsonUtils';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { FileUpload } from './FileUpload';

export const JsonFormatter: React.FC = () => {
  const {
    value: jsonInput,
    set: setJsonInput,
    undo,
    redo,
    canUndo,
    canRedo
  } = useUndoRedo('');
  
  const [formattedJson, setFormattedJson] = useState('');
  const [error, setError] = useState('');
  const [indent, setIndent] = useState(2);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleFormat = useCallback(() => {
    if (!jsonInput.trim()) {
      setError('Please enter JSON to format');
      setFormattedJson('');
      return;
    }

    const validation = validateJson(jsonInput);
    if (!validation.valid) {
      setError(validation.error || 'Invalid JSON');
      setFormattedJson('');
      return;
    }

    try {
      const formatted = formatJson(jsonInput, indent);
      setFormattedJson(formatted);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Formatting error');
    }
  }, [jsonInput, indent]);

  const handleMinify = useCallback(() => {
    if (!jsonInput.trim()) {
      setError('Please enter JSON to minify');
      setFormattedJson('');
      return;
    }

    const validation = validateJson(jsonInput);
    if (!validation.valid) {
      setError(validation.error || 'Invalid JSON');
      setFormattedJson('');
      return;
    }

    try {
      const minified = minifyJson(jsonInput);
      setFormattedJson(minified);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Minification error');
    }
  }, [jsonInput]);

  const handleCopy = async () => {
    const success = await copyToClipboard(formattedJson);
    setCopySuccess(success);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownload = () => {
    if (formattedJson) {
      downloadFile(formattedJson, 'formatted.json');
    }
  };

  const handleFileSelect = (content: string, filename: string) => {
    setJsonInput(content);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            JSON Formatter
          </h2>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">Indent:</label>
            <select
              value={indent}
              onChange={(e) => setIndent(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value="\t">Tabs</option>
            </select>
          </div>

          <FileUpload onFileSelect={handleFileSelect} className="ml-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Input JSON
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Undo"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Redo"
                >
                  <RotateCw size={16} />
                </button>
              </div>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-96 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm"
              placeholder="Paste your JSON here..."
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleFormat}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Format
              </button>
              <button
                onClick={handleMinify}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Minify
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Formatted Output
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!formattedJson}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Copy size={14} />
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!formattedJson}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            </div>
            <textarea
              value={formattedJson}
              readOnly
              className="w-full h-96 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm"
              placeholder="Formatted JSON will appear here..."
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};