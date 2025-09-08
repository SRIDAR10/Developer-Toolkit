import React, { useState, useCallback, useMemo } from 'react';
import { Search, Copy, Download, ChevronRight, ChevronDown } from 'lucide-react';
import { validateJson, copyToClipboard, downloadFile } from '../utils/jsonUtils';
import { FileUpload } from './FileUpload';

interface JsonNode {
  key: string;
  value: any;
  type: string;
  path: string;
}

const JsonTreeNode: React.FC<{
  node: JsonNode;
  level: number;
  searchTerm: string;
  onCopy: (value: any, path: string) => void;
}> = ({ node, level, searchTerm, onCopy }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const isSearchMatch = searchTerm && (
    node.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof node.value === 'string' && node.value.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderValue = (value: any, type: string) => {
    const colorClasses = {
      string: 'text-green-600 dark:text-green-400',
      number: 'text-blue-600 dark:text-blue-400',
      boolean: 'text-purple-600 dark:text-purple-400',
      null: 'text-gray-500 dark:text-gray-400'
    };

    if (type === 'object' && value !== null) {
      return (
        <span className="text-gray-600 dark:text-gray-300">
          {Array.isArray(value) ? `Array[${value.length}]` : `Object{${Object.keys(value).length}}`}
        </span>
      );
    }

    return (
      <span className={`${colorClasses[type as keyof typeof colorClasses] || 'text-gray-600 dark:text-gray-300'}`}>
        {type === 'string' ? `"${value}"` : String(value)}
      </span>
    );
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(node.value, node.path);
  };

  const isExpandable = node.type === 'object' && node.value !== null;

  return (
    <div 
      className={`${isSearchMatch ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}
      style={{ marginLeft: `${level * 20}px` }}
    >
      <div className="flex items-center py-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded group">
        {isExpandable ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded mr-1"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <div className="w-6 mr-1" />
        )}
        
        <span className="font-medium text-gray-800 dark:text-gray-200 mr-2">
          {node.key}:
        </span>
        
        {renderValue(node.value, node.type)}
        
        <button
          onClick={handleCopy}
          className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Copy value"
        >
          <Copy size={14} />
        </button>
      </div>
      
      {isExpandable && isExpanded && (
        <div>
          {Object.entries(node.value).map(([key, value]) => (
            <JsonTreeNode
              key={key}
              node={{
                key,
                value,
                type: value === null ? 'null' : typeof value,
                path: `${node.path}.${key}`
              }}
              level={level + 1}
              searchTerm={searchTerm}
              onCopy={onCopy}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const JsonViewer: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const jsonTree = useMemo(() => {
    if (!jsonInput.trim()) return null;
    
    const validation = validateJson(jsonInput);
    if (!validation.valid) {
      setError(validation.error || 'Invalid JSON');
      return null;
    }
    
    setError('');
    return validation.parsed;
  }, [jsonInput]);

  const handleCopy = useCallback(async (value: any, path: string) => {
    const textToCopy = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    const success = await copyToClipboard(textToCopy);
    setCopySuccess(success);
    setTimeout(() => setCopySuccess(false), 2000);
  }, []);

  const handleFileSelect = (content: string, filename: string) => {
    setJsonInput(content);
  };

  const handleDownload = () => {
    if (jsonTree) {
      downloadFile(JSON.stringify(jsonTree, null, 2), 'data.json');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            JSON Viewer
          </h2>
          <FileUpload onFileSelect={handleFileSelect} className="ml-auto" />
        </div>

        <div className="mb-4">
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm"
            placeholder="Paste your JSON here to view as an interactive tree..."
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {jsonTree && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search keys and values..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download size={16} />
                Download
              </button>
            </div>

            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-96 overflow-auto bg-gray-50 dark:bg-gray-900">
              <JsonTreeNode
                node={{
                  key: 'root',
                  value: jsonTree,
                  type: typeof jsonTree,
                  path: 'root'
                }}
                level={0}
                searchTerm={searchTerm}
                onCopy={handleCopy}
              />
            </div>

            {copySuccess && (
              <div className="mt-2 text-green-600 dark:text-green-400 text-sm">
                Copied to clipboard!
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};