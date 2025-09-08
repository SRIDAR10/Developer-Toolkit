import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { validateJson, convertJsonToYaml, convertJsonToCsv, downloadFile } from '../utils/jsonUtils';
import { FileUpload } from './FileUpload';

export const JsonParser: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [outputFormat, setOutputFormat] = useState<'json' | 'yaml' | 'csv'>('json');
  const [convertedOutput, setConvertedOutput] = useState('');
  const [parseInfo, setParseInfo] = useState<{
    valid: boolean;
    type: string;
    size: string;
    keys?: number;
    error?: string;
  } | null>(null);

  const handleParse = () => {
    if (!jsonInput.trim()) {
      setParseInfo({ valid: false, type: '', size: '', error: 'Please enter JSON to parse' });
      setConvertedOutput('');
      return;
    }

    const validation = validateJson(jsonInput);
    
    if (!validation.valid) {
      setParseInfo({ 
        valid: false, 
        type: '', 
        size: '', 
        error: validation.error 
      });
      setConvertedOutput('');
      return;
    }

    const parsed = validation.parsed;
    const type = Array.isArray(parsed) ? 'Array' : typeof parsed;
    const size = `${(new Blob([jsonInput]).size / 1024).toFixed(2)} KB`;
    const keys = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : undefined;

    setParseInfo({
      valid: true,
      type,
      size,
      keys
    });

    // Convert to selected format
    try {
      let output = '';
      switch (outputFormat) {
        case 'json':
          output = JSON.stringify(parsed, null, 2);
          break;
        case 'yaml':
          output = convertJsonToYaml(jsonInput);
          break;
        case 'csv':
          output = convertJsonToCsv(jsonInput);
          break;
      }
      setConvertedOutput(output);
    } catch (err) {
      setParseInfo({
        valid: false,
        type: '',
        size: '',
        error: `Conversion error: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
      setConvertedOutput('');
    }
  };

  const handleDownload = () => {
    if (!convertedOutput) return;
    
    const extensions = { json: 'json', yaml: 'yaml', csv: 'csv' };
    const mimeTypes = {
      json: 'application/json',
      yaml: 'text/yaml',
      csv: 'text/csv'
    };
    
    downloadFile(
      convertedOutput,
      `parsed.${extensions[outputFormat]}`,
      mimeTypes[outputFormat]
    );
  };

  const handleFileSelect = (content: string, filename: string) => {
    setJsonInput(content);
  };

  const getSchemaInfo = (obj: any): string => {
    if (obj === null) return 'null';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'Array (empty)';
      const firstItemType = getSchemaInfo(obj[0]);
      return `Array<${firstItemType}>`;
    }
    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) return 'Object (empty)';
      const schema = keys.slice(0, 3).map(key => `${key}: ${getSchemaInfo(obj[key])}`).join(', ');
      return `{ ${schema}${keys.length > 3 ? ', ...' : ''} }`;
    }
    return typeof obj;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            JSON Parser & Converter
          </h2>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">Output Format:</label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as 'json' | 'yaml' | 'csv')}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
              <option value="csv">CSV</option>
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
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-96 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm"
              placeholder="Paste your JSON here to parse and convert..."
            />
            <button
              onClick={handleParse}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Parse & Convert
            </button>
          </div>

          <div className="space-y-4">
            {parseInfo && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <FileText size={16} />
                  Parse Information
                </h3>
                
                {parseInfo.valid ? (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">Valid JSON</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Type:</span>
                      <span className="text-gray-800 dark:text-gray-200">{parseInfo.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Size:</span>
                      <span className="text-gray-800 dark:text-gray-200">{parseInfo.size}</span>
                    </div>
                    {parseInfo.keys !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Keys:</span>
                        <span className="text-gray-800 dark:text-gray-200">{parseInfo.keys}</span>
                      </div>
                    )}
                    {jsonInput && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400 text-xs">Schema:</span>
                        <div className="mt-1 text-xs text-gray-800 dark:text-gray-200 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          {getSchemaInfo(JSON.parse(jsonInput))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className="text-red-600 dark:text-red-400 font-medium">Invalid JSON</span>
                    </div>
                    {parseInfo.error && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 rounded text-red-700 dark:text-red-300 text-xs">
                        {parseInfo.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Converted Output ({outputFormat.toUpperCase()})
                </label>
                <button
                  onClick={handleDownload}
                  disabled={!convertedOutput}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
              <textarea
                value={convertedOutput}
                readOnly
                className="w-full h-80 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm"
                placeholder="Converted output will appear here..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};