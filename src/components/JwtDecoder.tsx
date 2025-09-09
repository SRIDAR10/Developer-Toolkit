import React, { useState, useMemo } from 'react';
import { Shield, Copy, Download, AlertCircle, CheckCircle, Key } from 'lucide-react';
import { decodeJwt, verifyJwtSignature, JwtDecodeResult } from '../utils/jwtUtils';
import { copyToClipboard, downloadFile } from '../utils/jsonUtils';
import { FileUpload } from './FileUpload';

export const JwtDecoder: React.FC = () => {
  const [jwtInput, setJwtInput] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [algorithm, setAlgorithm] = useState<'HS256' | 'RS256'>('HS256');
  const [copySuccess, setCopySuccess] = useState<string>('');

  const decodedJwt = useMemo(() => {
    if (!jwtInput.trim()) return null;
    return decodeJwt(jwtInput);
  }, [jwtInput]);

  const verificationResult = useMemo(async () => {
    if (!decodedJwt?.valid || !jwtInput.trim()) return null;
    
    const key = algorithm === 'HS256' ? secretKey : publicKey;
    if (!key.trim()) return null;

    try {
      const isValid = await verifyJwtSignature(jwtInput, key, algorithm);
      return { valid: isValid, error: null };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Verification failed' 
      };
    }
  }, [decodedJwt, jwtInput, secretKey, publicKey, algorithm]);

  const handleCopy = async (content: string, type: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  const handleDownload = (content: string, filename: string) => {
    downloadFile(content, filename, 'application/json');
  };

  const handleFileSelect = (content: string, filename: string) => {
    setJwtInput(content.trim());
  };

  const renderJsonSection = (title: string, data: any, type: 'header' | 'payload') => {
    const jsonString = JSON.stringify(data, null, 2);
    
    return (
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 capitalize">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(jsonString, type)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              aria-label={`Copy ${title}`}
            >
              <Copy size={12} />
              {copySuccess === type ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={() => handleDownload(jsonString, `jwt-${type}.json`)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              aria-label={`Download ${title}`}
            >
              <Download size={12} />
              Download
            </button>
          </div>
        </div>
        <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm font-mono overflow-auto max-h-64">
          {jsonString}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            JWT Decoder
          </h2>
          <FileUpload 
            onFileSelect={handleFileSelect} 
            accept=".txt,.jwt" 
            className="ml-auto" 
          />
        </div>

        {/* JWT Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            JWT Token
          </label>
          <textarea
            value={jwtInput}
            onChange={(e) => setJwtInput(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm resize-none"
            placeholder="Paste your JWT token here..."
            aria-label="JWT Token Input"
          />
        </div>

        {/* Signature Verification Section */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <Key className="w-4 h-4" />
            Signature Verification
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Algorithm
              </label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as 'HS256' | 'RS256')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                aria-label="Signature Algorithm"
              >
                <option value="HS256">HS256 (HMAC)</option>
                <option value="RS256">RS256 (RSA)</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {algorithm === 'HS256' ? 'Secret Key' : 'Public Key (PEM format)'}
              </label>
              {algorithm === 'HS256' ? (
                <input
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-mono"
                  placeholder="Enter secret key for HMAC verification..."
                  aria-label="Secret Key"
                />
              ) : (
                <textarea
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  className="w-full h-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-mono resize-none"
                  placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                  aria-label="Public Key"
                />
              )}
            </div>
          </div>

          {/* Verification Status */}
          {verificationResult && (
            <div className="mt-3 flex items-center gap-2">
              {verificationResult.valid ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                    Signature verified successfully
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                    {verificationResult.error || 'Invalid signature'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {decodedJwt && !decodedJwt.valid && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                Invalid JWT Token
              </p>
            </div>
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {decodedJwt.error}
            </p>
          </div>
        )}

        {/* Decoded JWT Display */}
        {decodedJwt?.valid && (
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {renderJsonSection('Header', decodedJwt.header, 'header')}
              {renderJsonSection('Payload', decodedJwt.payload, 'payload')}
            </div>
            
            {/* Token Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Token Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 dark:text-blue-300 font-medium">Algorithm:</span>
                  <span className="ml-2 text-blue-800 dark:text-blue-200">
                    {decodedJwt.header.alg || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-300 font-medium">Type:</span>
                  <span className="ml-2 text-blue-800 dark:text-blue-200">
                    {decodedJwt.header.typ || 'Not specified'}
                  </span>
                </div>
                {decodedJwt.payload.iss && (
                  <div>
                    <span className="text-blue-600 dark:text-blue-300 font-medium">Issuer:</span>
                    <span className="ml-2 text-blue-800 dark:text-blue-200">
                      {decodedJwt.payload.iss}
                    </span>
                  </div>
                )}
                {decodedJwt.payload.exp && (
                  <div>
                    <span className="text-blue-600 dark:text-blue-300 font-medium">Expires:</span>
                    <span className="ml-2 text-blue-800 dark:text-blue-200">
                      {new Date(decodedJwt.payload.exp * 1000).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};