import React, { useState, useMemo } from 'react';
import { Download, Copy } from 'lucide-react';
import { create } from 'jsondiffpatch';
import { validateJson, downloadFile, copyToClipboard } from '../utils/jsonUtils';
import { FileUpload } from './FileUpload';

const jsondiffpatch = create({
  objectHash: (obj: any) => obj.id || obj.name || obj._id || JSON.stringify(obj),
  arrays: { detectMove: true },
  textDiff: { minLength: 10 }
});

export const JsonDiffChecker: React.FC = () => {
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');
  const [diffMode, setDiffMode] = useState<'side-by-side' | 'inline'>('side-by-side');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const diffResult = useMemo(() => {
    if (!leftJson.trim() || !rightJson.trim()) return null;

    const leftValidation = validateJson(leftJson);
    const rightValidation = validateJson(rightJson);

    if (!leftValidation.valid) {
      setError(`Left JSON error: ${leftValidation.error}`);
      return null;
    }

    if (!rightValidation.valid) {
      setError(`Right JSON error: ${rightValidation.error}`);
      return null;
    }

    setError('');
    
    try {
      const delta = jsondiffpatch.diff(leftValidation.parsed, rightValidation.parsed);
      return {
        delta,
        left: leftValidation.parsed,
        right: rightValidation.parsed,
        hasChanges: !!delta
      };
    } catch (err) {
      setError(`Diff calculation error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    }
  }, [leftJson, rightJson]);

  const renderDiffValue = (key: string, value: any, changeType: 'added' | 'removed' | 'modified' | 'unchanged') => {
    const colors = {
      added: 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500',
      removed: 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500',
      modified: 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500',
      unchanged: 'bg-gray-50 dark:bg-gray-800'
    };

    const icons = {
      added: '+ ',
      removed: '- ',
      modified: '~ ',
      unchanged: ''
    };

    return (
      <div className={`p-2 mb-1 rounded ${colors[changeType]}`}>
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {icons[changeType]}{key}:
        </span>
        <span className="ml-2 text-gray-600 dark:text-gray-300 font-mono">
          {JSON.stringify(value, null, 2)}
        </span>
      </div>
    );
  };

  const renderInlineDiff = () => {
    if (!diffResult) return null;

    const changes: Array<{ key: string; value: any; type: 'added' | 'removed' | 'modified' }> = [];
    
    const processObject = (obj: any, path = '') => {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            if ('_t' in item && item._t === 'a') {
              // Array diff
              Object.keys(item).forEach(key => {
                if (key !== '_t') {
                  const arrayIndex = parseInt(key);
                  const value = item[key];
                  if (Array.isArray(value)) {
                    changes.push({
                      key: `${path}[${arrayIndex}]`,
                      value: value[0],
                      type: 'removed'
                    });
                  } else {
                    changes.push({
                      key: `${path}[${arrayIndex}]`,
                      value: value,
                      type: 'added'
                    });
                  }
                }
              });
            }
          }
        });
      } else if (Array.isArray(obj)) {
        // Deleted value
        changes.push({
          key: path,
          value: obj[0],
          type: 'removed'
        });
      } else {
        // Added value
        changes.push({
          key: path,
          value: obj,
          type: 'added'
        });
      }
    };

    if (diffResult.delta) {
      Object.keys(diffResult.delta).forEach(key => {
        const value = diffResult.delta[key];
        if (Array.isArray(value)) {
          if (value.length === 1) {
            changes.push({ key, value: value[0], type: 'removed' });
          } else if (value.length === 2) {
            changes.push({ key, value: value[0], type: 'removed' });
            changes.push({ key, value: value[1], type: 'added' });
          } else if (value.length === 3) {
            changes.push({ key, value: value[1], type: 'modified' });
          }
        } else if (typeof value === 'object') {
          processObject(value, key);
        } else {
          changes.push({ key, value, type: 'added' });
        }
      });
    }

    return (
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-96 overflow-auto bg-white dark:bg-gray-900">
        {changes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center">No differences found</p>
        ) : (
          changes.map((change, index) => (
            <div key={index}>
              {renderDiffValue(change.key, change.value, change.type)}
            </div>
          ))
        )}
      </div>
    );
  };

  const renderSideBySide = () => {
    if (!diffResult) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Original (Left)</h3>
          <pre className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-96 overflow-auto bg-gray-50 dark:bg-gray-900 text-sm">
            {JSON.stringify(diffResult.left, null, 2)}
          </pre>
        </div>
        <div>
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Modified (Right)</h3>
          <pre className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-96 overflow-auto bg-gray-50 dark:bg-gray-900 text-sm">
            {JSON.stringify(diffResult.right, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  const handleCopyDiff = async () => {
    if (diffResult && diffResult.delta) {
      const success = await copyToClipboard(JSON.stringify(diffResult.delta, null, 2));
      setCopySuccess(success);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownloadDiff = () => {
    if (diffResult && diffResult.delta) {
      downloadFile(JSON.stringify(diffResult.delta, null, 2), 'diff-result.json');
    }
  };

  const handleFileSelect = (content: string, filename: string, target: 'left' | 'right') => {
    if (target === 'left') {
      setLeftJson(content);
    } else {
      setRightJson(content);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            JSON Diff Checker
          </h2>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">View:</label>
            <select
              value={diffMode}
              onChange={(e) => setDiffMode(e.target.value as 'side-by-side' | 'inline')}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              <option value="side-by-side">Side by Side</option>
              <option value="inline">Inline Diff</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Original JSON (Left)
              </label>
              <FileUpload
                onFileSelect={(content, filename) => handleFileSelect(content, filename, 'left')}
                className=""
              />
            </div>
            <textarea
              value={leftJson}
              onChange={(e) => setLeftJson(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm"
              placeholder="Paste original JSON here..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Modified JSON (Right)
              </label>
              <FileUpload
                onFileSelect={(content, filename) => handleFileSelect(content, filename, 'right')}
                className=""
              />
            </div>
            <textarea
              value={rightJson}
              onChange={(e) => setRightJson(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm"
              placeholder="Paste modified JSON here..."
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {diffResult && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {diffResult.hasChanges ? 'Differences found' : 'No differences'}
                </span>
                {copySuccess && (
                  <span className="text-green-600 dark:text-green-400 text-sm">
                    Copied to clipboard!
                  </span>
                )}
              </div>
              
              {diffResult.hasChanges && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyDiff}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    <Copy size={14} />
                    Copy Diff
                  </button>
                  <button
                    onClick={handleDownloadDiff}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              )}
            </div>

            {diffMode === 'inline' ? renderInlineDiff() : renderSideBySide()}
          </>
        )}
      </div>
    </div>
  );
};