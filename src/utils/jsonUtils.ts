import * as yaml from 'js-yaml';
import Papa from 'papaparse';

export const formatJson = (input: string, indent: number | string = 2): string => {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, indent);
};

export const minifyJson = (input: string): string => {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed);
};

export const validateJson = (input: string): { valid: boolean; error?: string; parsed?: any } => {
  try {
    const parsed = JSON.parse(input);
    return { valid: true, parsed };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON' 
    };
  }
};

export const downloadFile = (content: string, filename: string, mimeType: string = 'application/json') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  }
};

export const convertJsonToYaml = (jsonString: string): string => {
  const parsed = JSON.parse(jsonString);
  return yaml.dump(parsed);
};

export const convertJsonToCsv = (jsonString: string): string => {
  const parsed = JSON.parse(jsonString);
  if (Array.isArray(parsed)) {
    return Papa.unparse(parsed);
  } else {
    // Convert single object to array
    return Papa.unparse([parsed]);
  }
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};